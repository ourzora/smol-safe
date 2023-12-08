import { useContext } from "react";
import { CurrentNetwork } from "../app/Root";
import { goerli, mainnet, optimism, zora, zoraTestnet } from "viem/chains";

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
  const currentNetwork = useContext(CurrentNetwork);
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
          (networkToExplorer as any)[currentNetwork]
        }/address/${address}`}
      >
        ↗
      </a>
    </span>
  );
};
