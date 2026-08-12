import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("createEscrow", function () {

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


    describe("Success", function () {


        it("Should create escrow successfully", async function () {

            const deadline = await getDeadline();


            await escrow.connect(buyer).createEscrow(
                seller.address,
                arbitrator.address,
                AMOUNT,
                deadline
            );


            const info = await escrow.getEscrow(0);


            expect(info.id).to.equal(0n);
            expect(info.buyer).to.equal(buyer.address);
            expect(info.seller).to.equal(seller.address);
            expect(info.arbitrator).to.equal(arbitrator.address);
            expect(info.amount).to.equal(AMOUNT);
            expect(info.deadline).to.equal(deadline);
            expect(info.platformFee).to.equal(250n);
            expect(info.status).to.equal(0n);
            expect(info.exists).to.equal(true);

        });



        it("Should emit EscrowCreated event", async function () {

    const deadline = await getDeadline();

    await expect(
        escrow.connect(buyer).createEscrow(
            seller.address,
            arbitrator.address,
            AMOUNT,
            deadline
        )
    )
    .to.emit(escrow, "EscrowCreated");

});


    });


    describe("Failure", function () {


        it("Should revert if seller is zero address", async function () {


            const deadline = await getDeadline();


            await expect(
                escrow.connect(buyer).createEscrow(
                    ethers.ZeroAddress,
                    arbitrator.address,
                    AMOUNT,
                    deadline
                )
            )
            .to.be.revertedWithCustomError(
                escrow,
                "ZeroAddress"
            );


        });








        it("should revert if amount is zero",async function(){
            const deadline = await getDeadline();

             await expect(
                escrow.connect(buyer).createEscrow(
                    seller.address,
                    arbitrator.address,
                    0,
                    deadline
                )
            )
            .to.be.revertedWithCustomError(
                escrow,
                "ZeroAmount"
            );


        });



        it("should revert if seller is buyer",async function(){
             const deadline = await getDeadline();

             await expect(
                escrow.connect(buyer).createEscrow(
                    buyer.address,
                    arbitrator.address,
                    0,
                    deadline
                )
            )
            .to.be.revertedWithCustomError(
                escrow,
                "BuyerCannotBeSeller"
            );
        });






         it("should revert if arbitator address is zero",async function(){
             const deadline = await getDeadline();

             await expect(
                escrow.connect(buyer).createEscrow(
                    seller.address,
                    ethers.ZeroAddress,
                    0,
                    deadline
                )
            )
            .to.be.revertedWithCustomError(
                escrow,
                "ZeroAddress"
            );



        });







    it("Should revert if buyer is arbitrator", async function () {

    const deadline = await getDeadline();

    await expect(
        escrow.connect(buyer).createEscrow(
            seller.address,
            buyer.address,
            AMOUNT,
            deadline
        )
    )
    .to.be.revertedWithCustomError(
        escrow,
        "BuyerCannotBeArbitrator"
    );

});





it("Should revert if seller is arbitrator", async function () {

    const deadline = await getDeadline();

    await expect(
        escrow.connect(buyer).createEscrow(
            seller.address,
            seller.address,
            AMOUNT,
            deadline
        )
    )
    .to.be.revertedWithCustomError(
        escrow,
        "SellerCannotBeArbitrator"
    );

});

it("Should revert if deadline is in the past", async function () {

    const block = await ethers.provider.getBlock("latest");

    const deadline = block.timestamp - 100;

    await expect(
        escrow.connect(buyer).createEscrow(
            seller.address,
            arbitrator.address,
            AMOUNT,
            deadline
        )
    )
    .to.be.revertedWithCustomError(
        escrow,
        "InvalidDeadline"
    );

});



it("Should increment escrow id correctly", async function () {

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );

    await escrow.connect(other).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );


    const first = await escrow.getEscrow(0);
    const second = await escrow.getEscrow(1);


    expect(first.id).to.equal(0n);
    expect(second.id).to.equal(1n);

});




it("Should store platform fee at creation time", async function () {

    const deadline = await getDeadline();

    await escrow.connect(buyer).createEscrow(
        seller.address,
        arbitrator.address,
        AMOUNT,
        deadline
    );


    const info = await escrow.getEscrow(0);


    expect(info.platformFee)
        .to.equal(BigInt(PLATFORM_FEE));

});









        });


    });







