import {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { Outlet, useParams } from "react-router-dom";
import { CurrentNetwork, WalletProviderContext } from "./Root";
import { Signer, ethers } from "ethers";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { contractNetworks } from "../chains";
import { Button, View, Text } from "reshaped";

export const SafeDataProvider = createContext<
  undefined | Awaited<ReturnType<typeof getSafeSDK>>
>(undefined);

async function getSafeSDK(safeAddress: string, signer: Signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeSdk: Safe = await Safe.create({
    ethAdapter: ethAdapter,
    safeAddress,
    contractNetworks,
  });

  const safeSdk2 = await safeSdk.connect({
    ethAdapter: new EthersAdapter({ ethers, signerOrProvider: signer }),
    safeAddress,
    contractNetworks,
  });
  return { safeSdk, safeSdk2, signer };
}

export const ViewSafe = () => {
  const params = useParams();
  const [safeData, setSafeData] = useState<any>();
  const providerContext = useContext(WalletProviderContext);
  const currentNetwork = useContext(CurrentNetwork);

  const setupSafe = useCallback(async () => {
    if (currentNetwork.toString() !== params.networkId) {
      return;
    }
    if (params.safeAddress && providerContext) {
      setSafeData(
        await getSafeSDK(params.safeAddress, providerContext.getSigner())
      );
    }
  }, [params]);

  const switchNetwork = useCallback(() => {
    providerContext?.send("wallet_switchEthereumChain", [
      {
        chainId: `0x${parseInt(params.networkId!, 10).toString(16)}`,
      },
    ]);
  }, [providerContext]);

  useEffect(() => {
    setupSafe();
  }, []);

  return (
    <SafeDataProvider.Provider value={safeData}>
      <View paddingTop={8} paddingBottom={8}>
        <Text variant="featured-2">View Safe</Text>
        <View paddingTop={4} />
        {safeData ? (
          <Outlet />
        ) : (
          <Button onClick={switchNetwork}>Switch network</Button>
        )}
      </View>
    </SafeDataProvider.Provider>
  );
};
