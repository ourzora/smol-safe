import { goerli, mainnet, optimism, zora, zoraTestnet } from "viem/chains";
import { useOutletContext } from "react-router-dom";
import { NetworkContext } from "./Contexts";

export const networkToExplorer = {
  [mainnet.id]: "https://etherscan.io/",
  [zora.id]: "https://explorer.zora.energy/",
  [goerli.id]: "https://goerli.etherscan.io/",
  [zoraTestnet.id]: "https://testnet.explorer.zora.energy/",
  [optimism.id]: "https://optimistic.etherscan.io/",
};

export const AddressView = ({
  address,
  prettyName,
}: {
  address: `0x${string}`;
  prettyName?: string;
}) => {
  const currentNetwork = useOutletContext<NetworkContext>().currentNetwork;
  //   const { data: ensName } = useEns({ address, enabled: !prettyName });
  const ensName = null;

  return (
    <span title={address}>
      {prettyName ? prettyName : ensName ? ensName : address}{" "}
      <a
        title="View on etherscan"
        target="_blank"
        className="text-gray-600 hover:color-black transition-color"
        href={`${
          (networkToExplorer as any)[Number(currentNetwork)]
        }/address/${address}`}
      >
        ↗
      </a>
    </span>
  );
};
