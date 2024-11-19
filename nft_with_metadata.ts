import { Connection, clusterApiUrl } from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
} from "@metaplex-foundation/js";

// Function to create and initialize an NFT with metadata using minimal approach
async function createNFTWithMetadata() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const payer = pg.wallet.keypair; // Ensure 'pg.wallet.keypair' is correctly initialized
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network", // Bundlr Devnet Address
        providerUrl: clusterApiUrl("devnet"), // RPC Endpoint
        timeout: 60000, // Optional: Set timeout as needed
      })
    );

  try {
    let uri = "hello"
    const { nft } = await metaplex.nfts().create({
      uri, // Metadata URI
      name: "My Awesome NFT",
      symbol: "AWESOME",
      sellerFeeBasisPoints: 500, // 5% royalties
      creators: [
        {
          address: payer.publicKey,
          share: 100,
        },
      ],
      updateAuthority: payer,
    });

    console.log(`NFT created with metadata: ${nft.address.toBase58()}`);
  } catch (error) {
    console.error("Error creating NFT with metadata:", error);
  }
}

createNFTWithMetadata().catch((error) => {
  console.error("Error creating NFT with metadata:", error);
});
