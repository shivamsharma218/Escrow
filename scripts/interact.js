import { network } from "hardhat";

const { ethers } = await network.getOrCreate();


async function main() {

    const [owner, buyer, seller, arbitrator] =
        await ethers.getSigners();


    const escrowAddress =
        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";


    const escrow =
        await ethers.getContractAt(
            "Escrow",
            escrowAddress
        );


    console.log("Buyer:", buyer.address);
    console.log("Seller:", seller.address);
    console.log("Arbitrator:", arbitrator.address);


    const amount =
        ethers.parseEther("1");


    const block =
        await ethers.provider.getBlock("latest");

    const deadline =
        Number(block.timestamp) + 3600;



    // CREATE ESCROW

    let tx =
        await escrow.connect(buyer)
        .createEscrow(
            seller.address,
            arbitrator.address,
            amount,
            deadline
        );


    await tx.wait();

    console.log("Escrow Created");



    // FUND ESCROW

    tx =
        await escrow.connect(buyer)
        .fundEscrow(0,{
            value: amount
        });


    await tx.wait();

    console.log("Escrow Funded");



    // SELLER ACCEPT

    tx =
        await escrow.connect(seller)
        .acceptEscrow(0);


    await tx.wait();

    console.log("Accepted");



    // MARK DELIVERED

    tx =
        await escrow.connect(seller)
        .markDelivered(0);


    await tx.wait();

    console.log("Delivered");



    // BUYER APPROVES PAYMENT

    tx =
        await escrow.connect(buyer)
        .approvePayment(0);


    await tx.wait();

    console.log("Payment Released");



    // CHECK SELLER BALANCE

    const pending =
        await escrow.pendingWithdrawals(
            seller.address
        );


    console.log(
        "Seller pending:",
        ethers.formatEther(pending)
    );



    // WITHDRAW

    tx =
        await escrow.connect(seller)
        .withdraw();


    await tx.wait();

    console.log("Seller Withdrawn");



    // GET ESCROW INFO

    const info =
        await escrow.getEscrow(0);


    console.log(info);



    console.log(
        "Fees:",
        ethers.formatEther(
            await escrow.accumulatedFees()
        )
    );

}


main().catch((error)=>{
    console.error(error);
    process.exit(1);
});