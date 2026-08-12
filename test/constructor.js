import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();
describe("Constructor", function () {
    let Escrow;
    let escrow;
    let owner;
    let user;

    const PLATFORM_FEE = 250; // 2.5%

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        Escrow = await ethers.getContractFactory("Escrow");

        escrow = await Escrow.deploy(
            owner.address,
            PLATFORM_FEE
        );

        await escrow.waitForDeployment();
    });

    describe("Deployment", function () {

        it("Should set the correct owner", async function () {
            expect(await escrow.owner())
                .to.equal(owner.address);
        });


        it("Should set the correct platform fee", async function () {
            expect(await escrow.platformFee())
                .to.equal(PLATFORM_FEE);
        });


        it("Should revert if platform fee exceeds MAX_FEE", async function () {

            await expect(
                Escrow.deploy(
                    owner.address,
                    1001
                )
            ).to.be.revertedWithCustomError(
                Escrow,
                "InvalidPlatformFee"
            );

        });

    });
});