// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IHubReader {
    function gmCount(address user) external view returns (uint256);
    function deployCount(address user) external view returns (uint256);
    function points(address user) external view returns (uint256);
}

/// @title BadgeNFT — milestone badges (GM, deploy, points, leaderboard rank)
contract BadgeNFT {
    string public constant NAME = "UNIBASE Badges";
    string public constant SYMBOL = "UNIBB";

    uint8 internal constant CAT_GM = 1;
    uint8 internal constant CAT_DEPLOY = 2;
    uint8 internal constant CAT_POINTS = 3;
    uint8 internal constant CAT_RANK = 4;

    IHubReader public immutable hub;
    address public owner;
    address public rankSigner;

    uint256 public nextTokenId = 1;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => uint256) public tokenBadgeType;
    mapping(address => mapping(uint256 badgeType => bool)) public hasMintedType;

  /// badgeType 1–3 GM · 4–6 Deploy · 7–9 Points · 10–12 Rank (top 10/50/100)
    mapping(uint256 => uint8) public badgeCategory;
    mapping(uint256 => uint256) public badgeThreshold;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );
    event BadgeMinted(
        address indexed user,
        uint256 indexed badgeType,
        uint256 indexed tokenId
    );
    event RankSignerUpdated(address indexed signer);

    error InvalidBadgeType();
    error AlreadyMinted();
    error RequirementsNotMet();
    error NonexistentToken();
    error InvalidSignature();
    error SignatureExpired();
    error RankMintDisabled();

    constructor(address hubAddress, address rankSignerAddress) {
        require(hubAddress != address(0), "zero hub");
        hub = IHubReader(hubAddress);
        owner = msg.sender;
        rankSigner = rankSignerAddress;

        _setBadge(1, CAT_GM, 10);
        _setBadge(2, CAT_GM, 20);
        _setBadge(3, CAT_GM, 50);
        _setBadge(4, CAT_DEPLOY, 10);
        _setBadge(5, CAT_DEPLOY, 20);
        _setBadge(6, CAT_DEPLOY, 50);
        _setBadge(7, CAT_POINTS, 100);
        _setBadge(8, CAT_POINTS, 500);
        _setBadge(9, CAT_POINTS, 1000);
        _setBadge(10, CAT_RANK, 10);
        _setBadge(11, CAT_RANK, 50);
        _setBadge(12, CAT_RANK, 100);
    }

    function setRankSigner(address newSigner) external {
        require(msg.sender == owner, "not owner");
        rankSigner = newSigner;
        emit RankSignerUpdated(newSigner);
    }

    function _setBadge(
        uint256 badgeType,
        uint8 category,
        uint256 threshold
    ) internal {
        badgeCategory[badgeType] = category;
        badgeThreshold[badgeType] = threshold;
    }

    function eligibility(
        address user,
        uint256 badgeType
    ) public view returns (bool) {
        if (badgeType < 1 || badgeType > 12) return false;
        if (hasMintedType[user][badgeType]) return false;

        uint8 category = badgeCategory[badgeType];
        uint256 threshold = badgeThreshold[badgeType];

        if (category == CAT_GM) {
            return hub.gmCount(user) >= threshold;
        }
        if (category == CAT_DEPLOY) {
            return hub.deployCount(user) >= threshold;
        }
        if (category == CAT_POINTS) {
            return hub.points(user) >= threshold;
        }
        return false;
    }

    function mint(uint256 badgeType) external {
        if (badgeType < 1 || badgeType > 9) revert InvalidBadgeType();
        if (hasMintedType[msg.sender][badgeType]) revert AlreadyMinted();
        if (!eligibility(msg.sender, badgeType)) revert RequirementsNotMet();
        _mintBadge(msg.sender, badgeType);
    }

    function mintRankBadge(
        uint256 badgeType,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (badgeType < 10 || badgeType > 12) revert InvalidBadgeType();
        if (rankSigner == address(0)) revert RankMintDisabled();
        if (hasMintedType[msg.sender][badgeType]) revert AlreadyMinted();
        if (block.timestamp > deadline) revert SignatureExpired();
        if (!_verifyRankSignature(msg.sender, badgeType, deadline, signature)) {
            revert InvalidSignature();
        }
        _mintBadge(msg.sender, badgeType);
    }

    function _mintBadge(address user, uint256 badgeType) internal {
        hasMintedType[user][badgeType] = true;

        uint256 tokenId = nextTokenId++;
        tokenBadgeType[tokenId] = badgeType;
        _owners[tokenId] = user;
        _balances[user]++;

        emit Transfer(address(0), user, tokenId);
        emit BadgeMinted(user, badgeType, tokenId);
    }

    function _verifyRankSignature(
        address user,
        uint256 badgeType,
        uint256 deadline,
        bytes calldata signature
    ) internal view returns (bool) {
        if (signature.length != 65) return false;

        bytes32 digest = keccak256(abi.encodePacked(user, badgeType, deadline));
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", digest)
        );

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (v < 27) v += 27;
        address recovered = ecrecover(ethHash, v, r, s);
        return recovered == rankSigner;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address tokenOwner = _owners[tokenId];
        if (tokenOwner == address(0)) revert NonexistentToken();
        return tokenOwner;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (_owners[tokenId] == address(0)) revert NonexistentToken();
        uint256 badgeType = tokenBadgeType[tokenId];
        uint8 category = badgeCategory[badgeType];
        uint256 threshold = badgeThreshold[badgeType];

        if (category == CAT_GM) {
            return string(
                abi.encodePacked("UNIBASE Badge: GM ", _uintToString(threshold))
            );
        }
        if (category == CAT_DEPLOY) {
            return string(
                abi.encodePacked(
                    "UNIBASE Badge: Deploy ",
                    _uintToString(threshold)
                )
            );
        }
        if (category == CAT_POINTS) {
            return string(
                abi.encodePacked(
                    "UNIBASE Badge: Points ",
                    _uintToString(threshold)
                )
            );
        }
        return string(
            abi.encodePacked(
                "UNIBASE Badge: Top ",
                _uintToString(threshold)
            )
        );
    }

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
