import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("fundEscrow", function () {

    let Escrow;
    let escrow;

    let owner;
    let buyer;
    let seller;
    let arbitrator;
    let other;

    const PLATFORM_FEE = 250;
    const AMOUNT = ethers.parseEther("1");


    beforeEach(async function () {

        [owner, buyer, seller, arbitrator, other] =
            await ethers.getSigners();


        Escrow = await ethers.getContractFactory("Escrow");


        escrow = await Escrow.deploy(
            owner.address,
            PLATFORM_FEE
        );


        await escrow.waitForDeployment();

    });


    async function getDeadline() {

        const block = await ethers.provider.getBlock("latest");

        return block.timestamp + 3600;

    }


    it("Should fund escrow successfully", async function () {

        const deadline = await getDeadline();


        await escrow.connect(buyer).createEscrow(
            seller.address,
            arbitrator.address,
            AMOUNT,
            deadline
        );


        await escrow.connect(buyer).fundEscrow(0, {
            value: AMOUNT
        });


        const info = await escrow.getEscrow(0);


        expect(info.status).to.equal(1n);

    });



    it("Should revert if funded amount is incorrect", async function () {

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );


    await expect(
        escrow.connect(buyer).fundEscrow(0, {
            value: ethers.parseEther("0.5")
        })
    )
    .to.be.revertedWithCustomError(
        escrow,
        "AmountMismatch"
    );

});



it("Should revert if non buyer funds escrow", async function () {

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );


    await expect(
       escrow.connect(other).fundEscrow(0, {
    value: AMOUNT
})
    )
    .to.be.revertedWithCustomError(
        escrow,
        "NotBuyer"
    );

});





it("Should revert if escrow does not exist", async function () {

    await expect(
        escrow.connect(buyer).fundEscrow(999, {
            value: AMOUNT
        })
    )
    .to.be.revertedWithCustomError(
        escrow,
        "EscrowNotFound"
    );

});




it("Should revert if escrow is already funded", async function () {

    const deadline = await getDeadline();


    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );


    await escrow.connect(buyer).fundEscrow(0,{
        value: AMOUNT
    });


    await expect(
        escrow.connect(buyer).fundEscrow(0,{
            value: AMOUNT
        })
    )
    .to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus"
    );

});




it("Should increase totalLockedFunds after funding", async function () {

    const deadline = await getDeadline();


    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );


    await escrow.connect(buyer).fundEscrow(0,{
        value: AMOUNT
    });


    expect(await escrow.totalLockedFunds())
        .to.equal(AMOUNT);

});




it("Should hold escrow ETH in contract", async function () {

    const deadline = await getDeadline();


    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );


    await escrow.connect(buyer).fundEscrow(0,{
        value: AMOUNT
    });


    const balance =
        await ethers.provider.getBalance(
            await escrow.getAddress()
        );


    expect(balance)
        .to.equal(AMOUNT);

});



it("Should emit EscrowFunded event", async function () {

    const deadline = await getDeadline();


    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );


    await expect(
        escrow.connect(buyer).fundEscrow(0,{
            value: AMOUNT
        })
    )
    .to.emit(escrow,"EscrowFunded")
    .withArgs(
        0,
        buyer.address,
        AMOUNT
    );

});


    

});

