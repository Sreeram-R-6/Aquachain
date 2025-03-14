// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SeafoodTracking {
    
    struct Fisherman {
        string name;
        string licenseId;
        bool isRegistered;
    }

    struct FishCatch {
        uint256 id;
        address fisherman;
        string species;
        uint256 weight;
        string gpsLocation;
        uint256 timestamp;
        bool isApproved;
        string approvalReason;
    }

    struct SaleTransaction {
        uint256 catchId;
        address buyer;
        uint256 weightSold;
        uint256 price;
        uint256 timestamp;
    }

    address public admin;
    uint256 public catchCounter;
    
    mapping(address => Fisherman) public fishermen;
    mapping(uint256 => FishCatch) public catches;
    mapping(uint256 => SaleTransaction[]) public sales; // Catch ID → Sales Records
    mapping(address => uint256[]) public fishermanCatches; // Fisherman → Catch IDs
    mapping(uint256 => uint256) public catchWeightSold; // Catch ID → Total Weight Sold
    
    event FishermanRegistered(address indexed fisherman, string licenseId);
    event CatchLogged(uint256 indexed catchId, address indexed fisherman);
    event CatchApproved(uint256 indexed catchId, bool isApproved, string reason);
    event FishSold(uint256 indexed catchId, address indexed buyer, uint256 weight, uint256 price);
    event GovernmentAudit(address auditor, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredFisherman() {
        require(fishermen[msg.sender].isRegistered, "Not a registered fisherman");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerFisherman(string memory _name, string memory _licenseId) external {
        require(!fishermen[msg.sender].isRegistered, "Already registered");
        fishermen[msg.sender] = Fisherman(_name, _licenseId, true);
        emit FishermanRegistered(msg.sender, _licenseId);
    }

    function logCatch(
        string memory _species, 
        uint256 _weight, 
        string memory _gpsLocation
    ) external onlyRegisteredFisherman {
        require(_weight > 0, "Invalid weight");

        catchCounter++;
        catches[catchCounter] = FishCatch(
            catchCounter,
            msg.sender,
            _species,
            _weight,
            _gpsLocation,
            block.timestamp,
            false,
            ""
        );
        fishermanCatches[msg.sender].push(catchCounter);
        emit CatchLogged(catchCounter, msg.sender);
    }

    function approveCatch(uint256 _catchId, bool _status, string memory _reason) external onlyAdmin {
        require(catches[_catchId].id != 0, "Catch does not exist");
        catches[_catchId].isApproved = _status;
        catches[_catchId].approvalReason = _reason;
        emit CatchApproved(_catchId, _status, _reason);
    }

    function sellFish(uint256 _catchId, address _buyer, uint256 _weight, uint256 _price) external {
        require(catches[_catchId].fisherman == msg.sender, "Not your catch");
        require(catches[_catchId].isApproved, "Catch not approved");
        require(_weight > 0 && _weight <= (catches[_catchId].weight - catchWeightSold[_catchId]), "Invalid weight");

        catchWeightSold[_catchId] += _weight;
        sales[_catchId].push(SaleTransaction(_catchId, _buyer, _weight, _price, block.timestamp));

        emit FishSold(_catchId, _buyer, _weight, _price);
    }

    function auditCompliance() external onlyAdmin {
        emit GovernmentAudit(msg.sender, block.timestamp);
    }

    function getCatchDetails(uint256 _catchId) external view returns (
        address fisherman, 
        string memory species, 
        uint256 weight, 
        string memory gpsLocation, 
        uint256 timestamp, 
        bool isApproved,
        string memory approvalReason
    ) {
        require(catches[_catchId].id != 0, "Catch not found");
        FishCatch memory fish = catches[_catchId];
        return (fish.fisherman, fish.species, fish.weight, fish.gpsLocation, fish.timestamp, fish.isApproved, fish.approvalReason);
    }

    function getSalesRecords(uint256 _catchId) external view returns (SaleTransaction[] memory) {
        return sales[_catchId];
    }

    function getFishermanCatches(address _fisherman) external view returns (uint256[] memory) {
        return fishermanCatches[_fisherman];
    }
}
