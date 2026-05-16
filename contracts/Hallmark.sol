// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// npx hardhat compile

/// @notice Minimal ERC721 receiver interface for safe transfers.
interface IERC721Receiver {
  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external returns (bytes4);
}

/// @notice Hallmark Protocol (hackathon edition)
/// - Register luxury assets as ERC721 NFTs
/// - Track provenance (ownership + values)
/// - Request verification with a MON bounty
/// - Verifiers stake MON to submit VERIFIED/FAKE verdicts
/// - Buyers can open disputes (with deposit) within 7 days of a transfer
/// - One seller appeal; appeal outcome is final
contract Hallmark {
  // =============================================================
  // ERC721 metadata
  // =============================================================

  string public constant name = "Hallmark";
  string public constant symbol = "HALL";

  // Monad testnet helper constant (not required for protocol logic)
  uint256 public constant MONAD_TESTNET_CHAIN_ID = 10143;

  // =============================================================
  // Protocol constants
  // =============================================================

  uint256 public constant DISPUTE_WINDOW = 7 days;

  /// @dev Fixed dispute deposit to keep the demo simple.
  /// You can change this value for your hackathon demo needs.
  uint256 public constant DISPUTE_DEPOSIT = 0.05 ether;

  // =============================================================
  // Enums
  // =============================================================

  enum Status {
    REGISTERED,
    VERIFIED,
    FAKE,
    DISPUTED,
    VERIFIED_FINAL,
    FAKE_FINAL
  }

  enum Verdict {
    VERIFIED,
    FAKE
  }

  // =============================================================
  // Structs
  // =============================================================

  struct Asset {
    string assetName;
    string brand;
    string serialNumber;
    string assetType;
    string metadataURI;
    uint256 estimatedValue;
    uint256 registeredAt;
    address registeredBy;
  }

  /// @notice Provenance event log.
  /// For transfers, `from/to/value` are used.
  /// For verification/dispute events, `action` describes what happened.
  struct HistoryEntry {
    uint256 timestamp;
    address from;
    address to;
    uint256 value;
    string action;
  }

  struct VerificationRequest {
    bool active;
    uint256 bounty;
    uint256 requestedAt;
  }

  struct VerificationRecord {
    address verifier;
    uint256 stake;
    uint256 timestamp;
    Verdict verdict;
  }

  struct LastSale {
    address seller;
    address buyer;
    uint256 timestamp;
    uint256 value;
  }

  struct Dispute {
    bool active;
    address opener; // buyer
    uint256 openedAt;
    uint256 deposit;

    bool appealUsed; // one appeal only
    bool appealOpen;
    uint256 appealOpenedAt;

    // The verification record being challenged (usually the latest at dispute time)
    uint256 challengedVerificationIndex;
  }

  // =============================================================
  // ERC721 storage (minimal)
  // =============================================================

  uint256 public nextTokenId = 1;

  mapping(uint256 => address) private _owners;
  mapping(address => uint256) private _balances;
  mapping(uint256 => address) private _tokenApprovals;
  mapping(address => mapping(address => bool)) private _operatorApprovals;
  mapping(uint256 => string) private _tokenURIs;

  // =============================================================
  // Protocol storage
  // =============================================================

  mapping(uint256 => Asset) private _assets;
  mapping(uint256 => Status) private _status;
  mapping(uint256 => HistoryEntry[]) private _history;

  mapping(bytes32 => bool) public serialUsed;

  mapping(uint256 => VerificationRequest) private _verificationRequests;
  mapping(uint256 => VerificationRecord[]) private _verifications;

  mapping(uint256 => LastSale) private _lastSale;
  mapping(uint256 => Dispute) private _disputes;

  /// @notice Very simple reputation score.
  mapping(address => uint256) private _verifierReputation;

  /// @notice Pull-payment bucket for bounties, deposits, and stake claims.
  mapping(address => uint256) public pendingWithdrawals;

  /// @notice Track which verification stakes were claimed (or slashed).
  mapping(uint256 => mapping(uint256 => bool)) public stakeClaimed;

  // =============================================================
  // Events
  // =============================================================

  // ERC721 events
  event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
  event Approval(address indexed tokenOwner, address indexed approved, uint256 indexed tokenId);
  event ApprovalForAll(address indexed tokenOwner, address indexed operator, bool approved);

  // Protocol events
  event AssetRegistered(uint256 indexed tokenId, address indexed owner, string assetName, string brand);
  event OwnershipTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 value);
  event VerificationRequested(uint256 indexed tokenId, address indexed owner, uint256 bounty);
  event AssetVerified(
    uint256 indexed tokenId,
    address indexed verifier,
    uint256 stakeAmount,
    Verdict verdict
  );
  event DisputeOpened(uint256 indexed tokenId, address indexed buyer, uint256 deposit);
  event AppealOpened(uint256 indexed tokenId, address indexed seller);
  event Finalized(uint256 indexed tokenId, Status finalStatus);
  event Withdrawal(address indexed account, uint256 amount);

  // =============================================================
  // Modifiers
  // =============================================================

  modifier tokenExists(uint256 tokenId) {
    require(_exists(tokenId), "bad token");
    _;
  }

  // =============================================================
  // Chain helper
  // =============================================================

  function isMonadTestnet() external view returns (bool) {
    return block.chainid == MONAD_TESTNET_CHAIN_ID;
  }

  function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
    return
      interfaceId == 0x01ffc9a7 || // ERC165
      interfaceId == 0x80ac58cd || // ERC721
      interfaceId == 0x5b5e139f; // ERC721Metadata
  }

  // =============================================================
  // Asset registration
  // =============================================================

  function registerAsset(
    string calldata assetName,
    string calldata brand,
    string calldata serialNumber,
    string calldata assetType,
    string calldata metadataURI,
    uint256 estimatedValue
  ) external returns (uint256 tokenId) {
    require(bytes(serialNumber).length > 0, "serial required");

    bytes32 serialHash = keccak256(bytes(serialNumber));
    require(!serialUsed[serialHash], "serial used");
    serialUsed[serialHash] = true;

    tokenId = nextTokenId++;

    _assets[tokenId] = Asset({
      assetName: assetName,
      brand: brand,
      serialNumber: serialNumber,
      assetType: assetType,
      metadataURI: metadataURI,
      estimatedValue: estimatedValue,
      registeredAt: block.timestamp,
      registeredBy: msg.sender
    });

    _status[tokenId] = Status.REGISTERED;
    _tokenURIs[tokenId] = metadataURI;

    _mint(msg.sender, tokenId);

    _history[tokenId].push(
      HistoryEntry({
        timestamp: block.timestamp,
        from: address(0),
        to: msg.sender,
        value: 0,
        action: "REGISTERED"
      })
    );

    emit AssetRegistered(tokenId, msg.sender, assetName, brand);
  }

  // =============================================================
  // Ownership transfers + provenance
  // =============================================================

  /// @notice Optional helper to record a sale value in the provenance history.
  function transferFromWithValue(
    address from,
    address to,
    uint256 tokenId,
    uint256 transferValue
  ) external tokenExists(tokenId) {
    require(_isApprovedOrOwner(msg.sender, tokenId), "cannot transfer");
    _transfer(from, to, tokenId, transferValue);
  }

  // =============================================================
  // Verification system
  // =============================================================

  /// @notice Asset owner requests verification and posts a MON bounty.
  function requestVerification(uint256 tokenId, uint256 bountyAmount) external payable tokenExists(tokenId) {
    require(ownerOf(tokenId) == msg.sender, "owner only");
    require(msg.value == bountyAmount, "bounty mismatch");
    require(bountyAmount > 0, "bounty=0");

    Status st = _status[tokenId];
    require(st != Status.DISPUTED, "in dispute");
    require(!_isFinal(st), "finalized");

    VerificationRequest storage req = _verificationRequests[tokenId];
    require(!req.active, "request active");

    _verificationRequests[tokenId] = VerificationRequest({
      active: true,
      bounty: bountyAmount,
      requestedAt: block.timestamp
    });

    _history[tokenId].push(
      HistoryEntry({
        timestamp: block.timestamp,
        from: msg.sender,
        to: address(0),
        value: bountyAmount,
        action: "VERIFICATION_REQUESTED"
      })
    );

    emit VerificationRequested(tokenId, msg.sender, bountyAmount);
  }

  /// @notice Verifier stakes MON and submits a verdict.
  /// The verifier earns the bounty (pull payment) once they verify.
  function verifyAsset(uint256 tokenId, Verdict verdict) external payable tokenExists(tokenId) {
    require(msg.value > 0, "stake=0");

    Status st = _status[tokenId];
    require(st != Status.DISPUTED, "in dispute");
    require(!_isFinal(st), "finalized");

    VerificationRequest storage req = _verificationRequests[tokenId];
    require(req.active, "no request");

    _verifications[tokenId].push(
      VerificationRecord({
        verifier: msg.sender,
        stake: msg.value,
        timestamp: block.timestamp,
        verdict: verdict
      })
    );

    // Simple reputation: +1 for participation.
    _verifierReputation[msg.sender] += 1;

    // Update current status (not final yet)
    _status[tokenId] = verdict == Verdict.VERIFIED ? Status.VERIFIED : Status.FAKE;

    // Bounty paid to verifier using pull-payments
    pendingWithdrawals[msg.sender] += req.bounty;
    req.active = false;
    req.bounty = 0;

    _history[tokenId].push(
      HistoryEntry({
        timestamp: block.timestamp,
        from: address(0),
        to: msg.sender,
        value: msg.value,
        action: verdict == Verdict.VERIFIED ? "VERIFIED" : "FAKE"
      })
    );

    emit AssetVerified(tokenId, msg.sender, msg.value, verdict);
  }

  // =============================================================
  // Dispute system
  // =============================================================

  /// @notice Buyer opens a dispute within 7 days of the last transfer.
  function openDispute(uint256 tokenId) external payable tokenExists(tokenId) {
    require(msg.value == DISPUTE_DEPOSIT, "bad deposit");

    LastSale memory sale = _lastSale[tokenId];
    require(sale.buyer == msg.sender, "buyer only");
    require(sale.timestamp > 0, "no transfer");
    require(block.timestamp <= sale.timestamp + DISPUTE_WINDOW, "window passed");

    Status st = _status[tokenId];
    require(st == Status.VERIFIED || st == Status.FAKE, "not verified");

    Dispute storage d = _disputes[tokenId];
    require(!d.active, "already disputed");
    require(_verifications[tokenId].length > 0, "no verification");

    d.active = true;
    d.opener = msg.sender;
    d.openedAt = block.timestamp;
    d.deposit = msg.value;
    d.appealUsed = false;
    d.appealOpen = false;
    d.appealOpenedAt = 0;
    d.challengedVerificationIndex = _verifications[tokenId].length - 1;

    _status[tokenId] = Status.DISPUTED;

    _history[tokenId].push(
      HistoryEntry({
        timestamp: block.timestamp,
        from: msg.sender,
        to: address(0),
        value: msg.value,
        action: "DISPUTE_OPENED"
      })
    );

    emit DisputeOpened(tokenId, msg.sender, msg.value);
  }

  /// @notice Seller (previous owner) can open ONE appeal.
  function openAppeal(uint256 tokenId) external tokenExists(tokenId) {
    Dispute storage d = _disputes[tokenId];
    require(d.active, "no dispute");
    require(!d.appealUsed, "appeal used");

    LastSale memory sale = _lastSale[tokenId];
    require(msg.sender == sale.seller, "seller only");

    d.appealUsed = true;
    d.appealOpen = true;
    d.appealOpenedAt = block.timestamp;

    _history[tokenId].push(
      HistoryEntry({
        timestamp: block.timestamp,
        from: msg.sender,
        to: address(0),
        value: 0,
        action: "APPEAL_OPENED"
      })
    );

    emit AppealOpened(tokenId, msg.sender);
  }

  /// @notice Any verifier can resolve an appeal by staking MON and submitting a final verdict.
  /// The appeal outcome becomes final (VERIFIED_FINAL or FAKE_FINAL).
  function resolveAppeal(uint256 tokenId, Verdict finalVerdict) external payable tokenExists(tokenId) {
    require(msg.value > 0, "stake=0");

    Dispute storage d = _disputes[tokenId];
    require(d.active, "no dispute");
    require(d.appealOpen, "no appeal");

    // Store the appeal verifier record
    _verifications[tokenId].push(
      VerificationRecord({
        verifier: msg.sender,
        stake: msg.value,
        timestamp: block.timestamp,
        verdict: finalVerdict
      })
    );

    _verifierReputation[msg.sender] += 1;

    // Determine if the original verification was overturned
    VerificationRecord memory challenged = _verifications[tokenId][d.challengedVerificationIndex];
    bool overturned = challenged.verdict != finalVerdict;

    if (overturned) {
      // Reputation penalty for the challenged verifier
      _decreaseReputation(challenged.verifier, 2);

      // Simple economic penalty: slash the challenged stake to the dispute opener
      // (This is intentionally simple for a hackathon demo.)
      if (!stakeClaimed[tokenId][d.challengedVerificationIndex]) {
        stakeClaimed[tokenId][d.challengedVerificationIndex] = true;
        pendingWithdrawals[d.opener] += challenged.stake;
      }

      // Buyer gets their deposit back
      pendingWithdrawals[d.opener] += d.deposit;
    } else {
      // Reputation bonus for being consistent and undisputed
      _verifierReputation[challenged.verifier] += 1;

      // Seller gets the buyer deposit if the dispute fails
      pendingWithdrawals[_lastSale[tokenId].seller] += d.deposit;
    }

    // Close dispute and finalize
    d.active = false;
    d.appealOpen = false;

    _status[tokenId] = finalVerdict == Verdict.VERIFIED ? Status.VERIFIED_FINAL : Status.FAKE_FINAL;

    _history[tokenId].push(
      HistoryEntry({
        timestamp: block.timestamp,
        from: address(0),
        to: msg.sender,
        value: msg.value,
        action: finalVerdict == Verdict.VERIFIED ? "VERIFIED_FINAL" : "FAKE_FINAL"
      })
    );

    emit Finalized(tokenId, _status[tokenId]);
  }

  // =============================================================
  // Finality (no infinite loops)
  // =============================================================

  /// @notice Finalize VERIFIED/FAKE if the last transfer's dispute window is over and no dispute is active.
  function finalizeUndisputed(uint256 tokenId) external tokenExists(tokenId) {
    Status st = _status[tokenId];
    require(st == Status.VERIFIED || st == Status.FAKE, "not finalizable");
    require(!_disputes[tokenId].active, "in dispute");

    LastSale memory sale = _lastSale[tokenId];

    // If there was a transfer, enforce the 7-day buyer dispute window.
    // If there was no transfer recorded, allow finalization immediately.
    if (sale.timestamp > 0) {
      require(block.timestamp > sale.timestamp + DISPUTE_WINDOW, "window not over");
    }

    _status[tokenId] = st == Status.VERIFIED ? Status.VERIFIED_FINAL : Status.FAKE_FINAL;

    _history[tokenId].push(
      HistoryEntry({
        timestamp: block.timestamp,
        from: address(0),
        to: address(0),
        value: 0,
        action: st == Status.VERIFIED ? "VERIFIED_FINAL" : "FAKE_FINAL"
      })
    );

    emit Finalized(tokenId, _status[tokenId]);
  }

  // =============================================================
  // Verifier stake claiming (simple)
  // =============================================================

  /// @notice Claim your stake once the asset is finalized, or once the dispute window is over.
  /// @dev Stakes that got slashed are marked `stakeClaimed = true` and cannot be claimed.
  function claimStake(uint256 tokenId, uint256 verificationIndex) external tokenExists(tokenId) {
    require(verificationIndex < _verifications[tokenId].length, "bad index");
    require(!stakeClaimed[tokenId][verificationIndex], "claimed");

    VerificationRecord memory r = _verifications[tokenId][verificationIndex];
    require(r.verifier == msg.sender, "not verifier");

    Status st = _status[tokenId];
    bool canClaim = _isFinal(st);

    if (!canClaim) {
      LastSale memory sale = _lastSale[tokenId];
      // If no sale recorded, just use record age.
      uint256 t = sale.timestamp > 0 ? sale.timestamp : r.timestamp;
      canClaim = !_disputes[tokenId].active && block.timestamp > t + DISPUTE_WINDOW;
    }

    require(canClaim, "not claimable");

    stakeClaimed[tokenId][verificationIndex] = true;
    pendingWithdrawals[msg.sender] += r.stake;
  }

  // =============================================================
  // Public getters (required by protocol rules)
  // =============================================================

  function getAsset(uint256 tokenId)
    external
    view
    tokenExists(tokenId)
    returns (Asset memory asset, Status status, address currentOwner)
  {
    return (_assets[tokenId], _status[tokenId], ownerOf(tokenId));
  }

  function getHistory(uint256 tokenId) external view tokenExists(tokenId) returns (HistoryEntry[] memory) {
    return _history[tokenId];
  }

  function getVerification(uint256 tokenId)
    external
    view
    tokenExists(tokenId)
    returns (Status status, VerificationRequest memory request, VerificationRecord[] memory records)
  {
    return (_status[tokenId], _verificationRequests[tokenId], _verifications[tokenId]);
  }

  function getDispute(uint256 tokenId)
    external
    view
    tokenExists(tokenId)
    returns (Dispute memory dispute, LastSale memory lastSale)
  {
    return (_disputes[tokenId], _lastSale[tokenId]);
  }

  function getVerifierReputation(address verifier) external view returns (uint256) {
    return _verifierReputation[verifier];
  }

  // =============================================================
  // Withdrawals (pull payments)
  // =============================================================

  function withdraw() external {
    uint256 amount = pendingWithdrawals[msg.sender];
    require(amount > 0, "no funds");

    pendingWithdrawals[msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{ value: amount }("");
    require(success, "withdraw failed");

    emit Withdrawal(msg.sender, amount);
  }

  // =============================================================
  // ERC721 (minimal)
  // =============================================================

  function balanceOf(address tokenOwner) public view returns (uint256) {
    require(tokenOwner != address(0), "zero address");
    return _balances[tokenOwner];
  }

  function ownerOf(uint256 tokenId) public view tokenExists(tokenId) returns (address) {
    return _owners[tokenId];
  }

  function tokenURI(uint256 tokenId) external view tokenExists(tokenId) returns (string memory) {
    return _tokenURIs[tokenId];
  }

  function approve(address to, uint256 tokenId) external tokenExists(tokenId) {
    address tokenOwner = ownerOf(tokenId);
    require(to != tokenOwner, "owner approval");
    require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "cannot approve");

    _tokenApprovals[tokenId] = to;
    emit Approval(tokenOwner, to, tokenId);
  }

  function getApproved(uint256 tokenId) public view tokenExists(tokenId) returns (address) {
    return _tokenApprovals[tokenId];
  }

  function setApprovalForAll(address operator, bool approved) external {
    require(operator != msg.sender, "self approval");
    _operatorApprovals[msg.sender][operator] = approved;
    emit ApprovalForAll(msg.sender, operator, approved);
  }

  function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
    return _operatorApprovals[tokenOwner][operator];
  }

  function transferFrom(address from, address to, uint256 tokenId) public tokenExists(tokenId) {
    require(_isApprovedOrOwner(msg.sender, tokenId), "cannot transfer");
    _transfer(from, to, tokenId, 0);
  }

  function safeTransferFrom(address from, address to, uint256 tokenId) external {
    safeTransferFrom(from, to, tokenId, "");
  }

  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
    transferFrom(from, to, tokenId);
    require(_checkOnERC721Received(from, to, tokenId, data), "unsafe receiver");
  }

  // =============================================================
  // Internal helpers
  // =============================================================

  function _mint(address to, uint256 tokenId) private {
    require(to != address(0), "zero mint");
    require(!_exists(tokenId), "minted");

    _balances[to] += 1;
    _owners[tokenId] = to;

    emit Transfer(address(0), to, tokenId);
  }

  function _transfer(address from, address to, uint256 tokenId, uint256 transferValue) private {
    require(ownerOf(tokenId) == from, "bad owner");
    require(to != address(0), "zero transfer");

    // Prevent moving assets while a dispute is active
    require(!_disputes[tokenId].active, "disputed");

    delete _tokenApprovals[tokenId];

    _balances[from] -= 1;
    _balances[to] += 1;
    _owners[tokenId] = to;

    _lastSale[tokenId] = LastSale({
      seller: from,
      buyer: to,
      timestamp: block.timestamp,
      value: transferValue
    });

    _history[tokenId].push(
      HistoryEntry({
        timestamp: block.timestamp,
        from: from,
        to: to,
        value: transferValue,
        action: "SOLD"
      })
    );

    emit Transfer(from, to, tokenId);
    emit OwnershipTransferred(tokenId, from, to, transferValue);
  }

  function _exists(uint256 tokenId) private view returns (bool) {
    return _owners[tokenId] != address(0);
  }

  function _isApprovedOrOwner(address spender, uint256 tokenId) private view returns (bool) {
    address tokenOwner = ownerOf(tokenId);
    return spender == tokenOwner || getApproved(tokenId) == spender || isApprovedForAll(tokenOwner, spender);
  }

  function _checkOnERC721Received(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
  ) private returns (bool) {
    if (to.code.length == 0) {
      return true;
    }

    try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 value) {
      return value == IERC721Receiver.onERC721Received.selector;
    } catch {
      return false;
    }
  }

  function _isFinal(Status st) private pure returns (bool) {
    return st == Status.VERIFIED_FINAL || st == Status.FAKE_FINAL;
  }

  function _decreaseReputation(address verifier, uint256 amount) private {
    uint256 rep = _verifierReputation[verifier];
    if (amount >= rep) {
      _verifierReputation[verifier] = 0;
    } else {
      _verifierReputation[verifier] = rep - amount;
    }
  }
}

