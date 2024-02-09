import { useState, useEffect, useCallback, useMemo } from "react";
import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { Signer, ethers } from "ethers";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { contractNetworks } from "../chains";
import { Button, View, Text } from "reshaped";
import { Address } from "viem";
import { NetworkContext, SafeContext, SafeInformationType } from "../components/Contexts";

type SafeData = Awaited<ReturnType<typeof getSafeSDK>>;

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

const useLoadSafeInformation = ({
  safeData,
}: {
  safeData: SafeData | undefined;
}) => {
  const [safeInformation, setSafeInformation] = useState<SafeInformationType>();
  useEffect(() => {
    if (!safeData) return;

    const loadSafeInfo = async () => {
      const { safeSdk, safeSdk2 } = safeData;
      const owners = await safeSdk.getOwners();
      const threshold = await safeSdk.getThreshold();
      const chainId = Number(await safeSdk.getChainId());
      const nonce = await safeSdk.getNonce();
      const address = (await safeSdk.getAddress()) as Address;

      setSafeInformation({
        owners,
        threshold,
        chainId,
        nonce,
        address,
        safeSdk,
        safeSdk2,
      });
    };

    loadSafeInfo();
  }, [safeData, setSafeInformation]);

  return safeInformation;
};

export const ViewSafe = () => {
  const params = useParams();
  const [safeData, setSafeData] = useState<SafeData>();
  const { walletProvider: providerContext } = useOutletContext<NetworkContext>();

  const setupSafe = useCallback(async () => {
    if (params.safeAddress && providerContext) {
      setSafeData(
        await getSafeSDK(params.safeAddress, await providerContext.getSigner()),
      );
    }
  }, [params.safeAddress, providerContext]);

  const switchNetwork = useCallback(() => {
    if (!params.networkId) return;
    providerContext?.send("wallet_switchEthereumChain", [
      {
        chainId: `0x${parseInt(params.networkId!).toString(16)}`,
      },
    ]);
  }, [params.networkId, providerContext]);

  useEffect(() => {
    switchNetwork();
  }, [switchNetwork]);

  useEffect(() => {
    setupSafe();
  }, [setupSafe]);

  const safeInformation = useLoadSafeInformation({ safeData });

  const safeInformationContext: SafeContext |undefined = useMemo(() => {
    if (!safeInformation) return;
    return {
      safeInformation
    };
  }, [safeInformation]);

  return (
    <View paddingTop={8} paddingBottom={8}>
      <Text variant="featured-2">View Safe</Text>
      <View paddingTop={4} />
      {safeInformationContext ? (
        <Outlet context={safeInformationContext} />
      ) : (
        <Button onClick={switchNetwork}>Switch network</Button>
      )}
    </View>
  );
};
