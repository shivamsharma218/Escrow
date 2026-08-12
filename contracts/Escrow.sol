// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EscrowEvents} from "./events/EscrowEvents.sol";




contract Escrow is
    Ownable,
    Pausable,
    ReentrancyGuard,
    EscrowEvents{
    enum  EscrowStatus{
        Created,
        Funded,
        Accepted,
        Delivered,
        Completed,
        Cancelled,
        Disputed,
        Resolved

    }

    struct EscrowInfo {
    uint256 id;
    address buyer;
    address seller;
    address arbitrator;
    uint256 amount;
    uint256 deadline;
    uint256 createdAt;
    uint96 platformFee;
    EscrowStatus status;
    bool exists;
}


uint96 public constant FEE_DENOMINATOR = 10_000;
uint96 public constant MAX_FEE = 1_000;
uint256 public constant FEE_TIMELOCK = 2 days;
uint256 public totalLockedFunds;
uint256 public totalPendingWithdrawals;

 uint256 public nextEscrowId;

uint96 public platformFee;
uint96 public pendingFee;
uint256 public feeChangeUnlockTime;

uint256 public accumulatedFees;


mapping(uint256 => EscrowInfo) private escrows;

mapping(address => uint256[]) private buyerEscrows;

mapping(address => uint256[]) private sellerEscrows;

mapping(address => uint256) public pendingWithdrawals;




//errors


error ZeroAddress();
error ZeroAmount();
error TransferFailed();

error InvalidPlatformFee();
error PlatformFeeUnchanged();
error FeeExceedsMax();
error TimelockNotElapsed();
error NoPendingFeeChange();

error EscrowNotFound();
error InvalidStatus();
error InvalidDeadline();
error DeadlinePassed();
error DeadlineNotPassed();

error NotBuyer();
error NotSeller();
error NotArbitrator();

error BuyerCannotBeSeller();
error BuyerCannotBeArbitrator();
error SellerCannotBeArbitrator();

error AmountMismatch();


error NoFeesAvailable();
error InvalidRecipient();
error Unauthorized();
error NoWithdrawalAvailable();
error InsufficientRescueBalance();







constructor(address initialOwner,
uint96 _platformFee)
Ownable(initialOwner){if (_platformFee > MAX_FEE) {
    revert InvalidPlatformFee();
}
    platformFee = _platformFee;
}

//modifiers
modifier escrowExists(uint256 escrowId) {
    if (!escrows[escrowId].exists) {
        revert EscrowNotFound();
    }
    _;
}

modifier onlyBuyer(uint256 escrowId) {
    if (msg.sender != escrows[escrowId].buyer) {
        revert NotBuyer();
    }
    _;
}

modifier onlySeller(uint256 escrowId) {
    if (msg.sender != escrows[escrowId].seller) {
        revert NotSeller();
    }
    _;
}

modifier onlyArbitrator(uint256 escrowId) {
    if (msg.sender != escrows[escrowId].arbitrator) {
        revert NotArbitrator();
    }
    _;
}

modifier whenStatus(
    uint256 escrowId,
    EscrowStatus expectedStatus
) {
    if (escrows[escrowId].status != expectedStatus) {
        revert InvalidStatus();
    }
    _;
}




//functions

function _checkAddress(address account) internal pure {
    if (account == address(0)) {
        revert ZeroAddress();
    }
}


//create escrow
function createEscrow(
    address seller,
    address arbitrator,
    uint256 amount,
    uint256 deadline
)external whenNotPaused{
    _checkAddress(seller);
    _checkAddress(arbitrator);

    if(seller == msg.sender){
        revert BuyerCannotBeSeller();
    }

    if(arbitrator == msg.sender){
        revert BuyerCannotBeArbitrator();
    }
    if (seller == arbitrator) {
        revert SellerCannotBeArbitrator();
    }
    if(amount == 0){
        revert ZeroAmount();
    }
    if(deadline <= block.timestamp){
        revert InvalidDeadline();
    }

    uint256 escrowId = nextEscrowId;
unchecked {
    ++nextEscrowId;
}

    escrows[escrowId] = EscrowInfo({
    id: escrowId,
    buyer: msg.sender,
    seller: seller,
    arbitrator: arbitrator,
    amount: amount,
    deadline: deadline,
    createdAt: block.timestamp,
    platformFee: platformFee,
    status: EscrowStatus.Created,
    exists: true
});

    buyerEscrows[msg.sender].push(escrowId);
    sellerEscrows[seller].push(escrowId);


    emit EscrowCreated(
        escrowId,
        msg.sender,
        seller,
        arbitrator,
        amount,
        deadline

    );
}

//EscrowFunded
function fundEscrow(
    uint256 escrowId
)
    external
    payable
    whenNotPaused
    escrowExists(escrowId)
    onlyBuyer(escrowId)
    whenStatus(escrowId, EscrowStatus.Created){
        EscrowInfo storage escrow = escrows[escrowId];

if (msg.value != escrow.amount) {
    revert AmountMismatch();
}


escrow.status = EscrowStatus.Funded;

totalLockedFunds += msg.value;

emit EscrowFunded(escrowId, msg.sender, msg.value);
    }


    //accept escrow

 function acceptEscrow(
    uint256 escrowId
)
    external
    
    whenNotPaused
    escrowExists(escrowId)
    onlySeller(escrowId)
    whenStatus(escrowId, EscrowStatus.Funded)
{
    EscrowInfo storage escrow = escrows[escrowId];

    if (block.timestamp > escrow.deadline) {
        revert DeadlinePassed();
    }

    escrow.status = EscrowStatus.Accepted;

    emit EscrowAccepted(
        escrowId,
        msg.sender
    );
}


//mark delivered

function markDelivered(
    uint256 escrowId
)

external
whenNotPaused
escrowExists(escrowId)
onlySeller(escrowId)
whenStatus(escrowId, EscrowStatus.Accepted){
    
    
    EscrowInfo storage escrow = escrows[escrowId];
    if (block.timestamp > escrow.deadline) {
    revert DeadlinePassed();
}

escrow.status = EscrowStatus.Delivered;

emit WorkDelivered(escrowId, msg.sender);
}



//approve payment
function approvePayment(
    uint256 escrowId
)
external
nonReentrant
whenNotPaused
escrowExists(escrowId)
onlyBuyer(escrowId)
whenStatus(escrowId, EscrowStatus.Delivered)
{
    EscrowInfo storage escrow = escrows[escrowId];

    uint256 fee =
        (escrow.amount * escrow.platformFee)
        / FEE_DENOMINATOR;


    uint256 sellerAmount =
        escrow.amount - fee;


    accumulatedFees += fee;


    totalLockedFunds -= escrow.amount;


    pendingWithdrawals[escrow.seller] += sellerAmount;

    totalPendingWithdrawals += sellerAmount;


    escrow.status = EscrowStatus.Completed;

    escrow.amount = 0;


    emit PaymentReleased(
        escrowId,
        escrow.seller,
        sellerAmount,
        fee
    );
}

//cancel escrow

function cancelEscrow(
    uint256 escrowId
)
external
nonReentrant
whenNotPaused
escrowExists(escrowId)
onlyBuyer(escrowId)
{
    EscrowInfo storage escrow = escrows[escrowId];

    EscrowStatus currentStatus = escrow.status;

    uint256 refundAmount;

    if (currentStatus == EscrowStatus.Created) {

        // No ETH deposited
        escrow.status = EscrowStatus.Cancelled;

    } 
    else if (currentStatus == EscrowStatus.Funded) {

        refundAmount = escrow.amount;

        escrow.status = EscrowStatus.Cancelled;

        // Remove locked funds
        totalLockedFunds -= refundAmount;

        // Clear amount to prevent reuse
        escrow.amount = 0;

        // Add refund to withdrawal queue
        pendingWithdrawals[escrow.buyer] += refundAmount;
        totalPendingWithdrawals += refundAmount;

    } 
    else if (currentStatus == EscrowStatus.Accepted) {

        if (block.timestamp <= escrow.deadline) {
            revert DeadlineNotPassed();
        }

        refundAmount = escrow.amount;

        escrow.status = EscrowStatus.Cancelled;

        // Remove locked funds
        totalLockedFunds -= refundAmount;

        // Clear amount
        escrow.amount = 0;

        // Add refund to withdrawal queue
        pendingWithdrawals[escrow.buyer] += refundAmount;
        totalPendingWithdrawals += refundAmount;

    } 
    else {
        revert InvalidStatus();
    }


    emit EscrowCancelled(
        escrowId,
        escrow.buyer
    );
}






//raise dispute

function raiseDispute(
    uint256 escrowId
)
    external
    whenNotPaused
    escrowExists(escrowId)
{
    EscrowInfo storage escrow = escrows[escrowId];

    if (
        msg.sender != escrow.buyer &&
        msg.sender != escrow.seller
    ) {
        revert Unauthorized();
    }

    if (escrow.status != EscrowStatus.Delivered) {
        revert InvalidStatus();

    }
    
    escrow.status = EscrowStatus.Disputed;

    emit DisputeRaised(
        escrowId,
        msg.sender
    );
}


//resolve dispute

function resolveDispute(
    uint256 escrowId,
    address winner
)external
nonReentrant
whenNotPaused
escrowExists(escrowId)
onlyArbitrator(escrowId)
whenStatus(escrowId, EscrowStatus.Disputed){
    EscrowInfo storage escrow = escrows[escrowId];

    if(
        winner != escrow.buyer &&
        winner != escrow.seller
    ){
        revert InvalidRecipient();
    }
   
    uint256 amount;

    if(winner == escrow.seller){
        uint256 fee = (escrow.amount * escrow.platformFee)/ FEE_DENOMINATOR;
        accumulatedFees += fee;
        amount = escrow.amount -fee;

    }else{
        amount = escrow.amount;

    }
    totalLockedFunds -= escrow.amount;

    pendingWithdrawals[winner] += amount;
totalPendingWithdrawals += amount;

escrow.amount = 0;
escrow.status = EscrowStatus.Resolved;
    

    emit DisputeResolved(escrowId, winner, amount);

}


//withdraw fee

function withdrawFees(
    address receiver
)
    external
    onlyOwner
    nonReentrant
{
    _checkAddress(receiver);

    uint256 amount = accumulatedFees;

    if (amount == 0) {
        revert NoFeesAvailable();
    }

    uint256 requiredBalance =
        totalLockedFunds +
        totalPendingWithdrawals +
        amount;

    if (address(this).balance < requiredBalance) {
        revert InsufficientRescueBalance();
    }

    accumulatedFees = 0;

    (bool success,) =
        payable(receiver).call{value: amount}("");

    if (!success) {
        revert TransferFailed();
    }

    emit FeesWithdrawn(receiver, amount);
}

//withdraw
function withdraw() external nonReentrant {

    uint256 amount = pendingWithdrawals[msg.sender];

    if(amount == 0){
        revert NoWithdrawalAvailable();
    }

    pendingWithdrawals[msg.sender] = 0;

    totalPendingWithdrawals -= amount;

    (bool success,) =
        payable(msg.sender).call{value: amount}("");

    if(!success){
        revert TransferFailed();
    }

    emit Withdrawn(
        msg.sender,
        amount
    );
}




// seller reject escrow    

function rejectEscrow(
    uint256 escrowId
)
    external
    nonReentrant
    whenNotPaused
    escrowExists(escrowId)
    onlySeller(escrowId)
    whenStatus(escrowId, EscrowStatus.Funded)
{
    EscrowInfo storage escrow = escrows[escrowId];

    uint256 refund = escrow.amount;

    escrow.status = EscrowStatus.Cancelled;
    escrow.amount = 0;

    totalLockedFunds -= refund;

    pendingWithdrawals[escrow.buyer] += refund;
    totalPendingWithdrawals += refund;

    emit EscrowCancelled(escrowId, msg.sender);
}


//set platform fe


function proposePlatformFee(
    uint96 newFee
)
    external
    onlyOwner
{
    if (newFee > MAX_FEE) {
        revert FeeExceedsMax();
    }

    if (newFee == platformFee) {
        revert PlatformFeeUnchanged();
    }

    pendingFee = newFee;
    feeChangeUnlockTime = block.timestamp + FEE_TIMELOCK;

    emit PlatformFeeProposed(newFee, feeChangeUnlockTime);
}


function executePlatformFee() external onlyOwner {
    if (feeChangeUnlockTime == 0) {
        revert NoPendingFeeChange();
    }

    if (block.timestamp < feeChangeUnlockTime) {
        revert TimelockNotElapsed();
    }

    uint96 oldFee = platformFee;

    platformFee = pendingFee;
    pendingFee = 0;
    feeChangeUnlockTime = 0;

    emit PlatformFeeUpdated(oldFee, platformFee);
}





function pause() external onlyOwner {
    _pause();
}

function unpause() external onlyOwner {
    _unpause();
}


//get escrow
function getEscrow(
    uint256 escrowId
)
    external
    view
    escrowExists(escrowId)
    returns (EscrowInfo memory)
{
    return escrows[escrowId];
}



function getBuyerEscrows(
    address buyer
)
    external
    view
    returns (uint256[] memory)
{
    return buyerEscrows[buyer];
}



function getSellerEscrows(
    address seller
)
    external
    view
    returns (uint256[] memory)
{
    return sellerEscrows[seller];
}



//rescue eth

function rescueETH(
    address receiver,
    uint256 amount
)
external
onlyOwner
nonReentrant
{
    _checkAddress(receiver);

    uint256 available =
    address(this).balance
    - totalLockedFunds
    - totalPendingWithdrawals
    - accumulatedFees;

    if(amount > available){
        revert InsufficientRescueBalance();
    }

    (bool success,) =
        payable(receiver).call{value: amount}("");

    if(!success){
        revert TransferFailed();
    }

    emit ETHRescued(receiver, amount);
}



function depositETH()
    external
    payable
    onlyOwner
{
    if (msg.value == 0) {
        revert ZeroAmount();
    }

    emit ETHDeposited(msg.sender, msg.value);
}


receive() external payable {
    emit ETHDeposited(msg.sender,msg.value);
}







}