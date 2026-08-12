import { network } from "hardhat";

const { ethers } = await network.getOrCreate();

async function main() {

    const initialOwner =
        "0xAb591dC206ebB22fD44ed8B1588475a02ceBE31D";

    const platformFee = 250;


    const Escrow =
        await ethers.getContractFactory("Escrow");


    const escrow =
        await Escrow.deploy(
            initialOwner,
            platformFee
        );


    await escrow.waitForDeployment();


    console.log(
        "Escrow deployed to:",
        await escrow.getAddress()
    );


    console.log(
        "Owner:",
        initialOwner
    );
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});