// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

interface IAccessControlBase {
    struct Proof {
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint expiredTime;
    }

    function verifyProof(bytes memory encode, Proof[] memory _proofs) external returns (bool);
}

contract AccessControlBase is IAccessControlBase {
    using SafeERC20 for IERC20;

    address private _owner;
    address public newOwner;

    mapping(address => bool) public operators;
    address[] public addedOperators;

    mapping(address => bool) public signers;
    address[] public addedSigner;
    uint public numberOfComfirmation = 1;

    event SetOperator(address indexed add, bool value);
    event SetSigner(address indexed add, bool value);
    event NewOwner(address indexed add);

    constructor() {
        _owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner);
        _;
    }

    modifier onlyOperator() {
        require(operators[msg.sender]);
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function setNewOwner(address _newOwner) external onlyOwner {
        newOwner = _newOwner;
    }

    function confirmTransferOwner() external {
        require(msg.sender == newOwner, "AccessControlBase: Wrong permission");
        _owner = newOwner;

        emit NewOwner(newOwner);
    }

    function setOperator(address _operator, bool _v) external onlyOwner {
        operators[_operator] = _v;
        if (_v) {
            addedOperators.push(_operator);
        }
        emit SetOperator(_operator, _v);
    }

    function setNumberOfComfirmation(uint _n) external onlyOwner {
        numberOfComfirmation = _n;
    }

    function setSigner(address _signer, bool _v) external onlyOwner {
        signers[_signer] = _v;
        if (_v) {
            addedSigner.push(_signer);
        }
        emit SetSigner(_signer, _v);
    }

    function getChainID() public view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    function verifyProof(bytes memory encode, Proof[] memory _proofs)
        public
        view
        returns (bool)
    {
        require(_proofs.length >= numberOfComfirmation, "AccessControlBase: Missing proofs");

        address[] memory checkKey = new address[](_proofs.length);

        for (uint i = 0; i < _proofs.length; i++) {
            Proof memory _proof = _proofs[i];
            require(_proof.expiredTime > block.timestamp, "AccessControlBase: Expired proof");

            bytes32 digest = keccak256(
                abi.encodePacked(getChainID(), address(this), encode, _proof.expiredTime)
            );
            address signatory = ecrecover(digest, _proof.v, _proof.r, _proof.s);
            require(signers[signatory], "AccessControlBase: Invalid signer");

            for (uint j = 0; j < i; j++) {
                require(checkKey[j] != signatory, "AccessControlBase: Duplicate proof");
            }

            checkKey[i] = signatory;
        }
        return true;
    }
}
