// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

abstract contract EscrowEvents {
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        address arbitrator,
        uint256 amount,
        uint256 deadline
    );

    event EscrowFunded(
        uint256 indexed escrowId,
        address indexed buyer,
        uint256 amount
    );

    event EscrowAccepted(
        uint256 indexed escrowId,
        address indexed seller
    );

    event WorkDelivered(
        uint256 indexed escrowId,
        address indexed seller
    );

    event ETHRescued(
    address indexed receiver,
    uint256 amount
);

    event PaymentReleased(
        uint256 indexed escrowId,
        address indexed seller,
        uint256 sellerAmount,
        uint256 platformFee
    );

    event EscrowCancelled(
    uint256 indexed escrowId,
    address indexed cancelledBy
);

    event DisputeRaised(
        uint256 indexed escrowId,
        address indexed raisedBy
    );

    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed winner,
        uint256 amount
    );

    event PlatformFeeUpdated(
        uint96 oldFee,
        uint96 newFee
    );

    event FeesWithdrawn(
        address indexed receiver,
        uint256 amount
    );
event PlatformFeeProposed(uint96 newFee, uint256 unlockTime);
event Withdrawn(address indexed account, uint256 amount);
event ETHDeposited(address indexed sender, uint256 amount);
}