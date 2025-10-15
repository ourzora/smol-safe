import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Button, View } from "reshaped";
import { NetworkSwitcher } from "../components/NetworkSwitcher";
import { BrowserProvider } from "ethers";
import { NetworkContext } from "../components/Contexts";
import { allowedNetworks } from "../chains";

export const Root = () => {
  const [provider, setProvider] = useState<
    ethers.BrowserProvider | undefined
  >();
  const networkIdFromRoute = useParams().networkId;

  const [currentNetwork, setCurrentNetwork] = useState<number>(0);
  const [multichainSession, setMultichainSession] = useState<boolean>(false);

  const connectMetamask = useCallback(async () => {
    const provider = new BrowserProvider((window as any).ethereum, "any");

    // Check if MetaMask supports multichain API
    const isMultichainSupported = typeof (window as any).ethereum?.request === 'function';

    if (isMultichainSupported) {
      try {
        // Create a multichain session with all allowed networks
        const optionalScopes = Object.keys(allowedNetworks).reduce((acc, chainId) => {
          acc[`eip155:${chainId}`] = {
            methods: [
              "eth_sendTransaction",
              "eth_signTransaction",
              "eth_sign",
              "personal_sign",
              "eth_signTypedData",
              "eth_signTypedData_v4",
              "eth_getBalance",
              "eth_call"
            ],
            accounts: []
          };
          return acc;
        }, {} as Record<string, any>);

        await (window as any).ethereum.request({
          method: "wallet_createSession",
          params: {
            optionalScopes
          }
        });

        setMultichainSession(true);
        console.log("Multichain session created");
      } catch (error) {
        console.log("Multichain API not available, falling back to standard connection", error);
      }
    }

    provider.on("accountsChanged", async (accounts) => {
      console.log({ accounts });
      const newNetwork = await provider.getNetwork();
      setCurrentNetwork(Number(newNetwork.chainId));
    });
    provider.on("disconnect", () => {
      setProvider(undefined);
      setCurrentNetwork(0);
      setMultichainSession(false);
    });
    provider.on("connect", async () => {
      setProvider(provider);
      const network = await provider.getNetwork();
      setCurrentNetwork(Number(network.chainId));
    });
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    if (provider && signer) {
      const network = await provider.getNetwork();
      setCurrentNetwork(Number(network.chainId));
      setProvider(provider);
    }
  }, [setProvider, setCurrentNetwork]);
  useEffect(() => {
    connectMetamask();
  }, [connectMetamask]);

  const networkContext: NetworkContext | undefined = useMemo(() => {
    if (!provider) return;

    return {
      walletProvider: provider,
      currentNetwork,
    };
  }, [provider, currentNetwork]);

  useEffect(() => {
    if (!networkIdFromRoute) return;
    if (currentNetwork !== Number(networkIdFromRoute)) {
      provider?.send("wallet_switchEthereumChain", [
        {
          chainId: `0x${parseInt(networkIdFromRoute).toString(16)}`,
        },
      ]);

      setCurrentNetwork(Number(networkIdFromRoute));
    }
  }, [currentNetwork, networkIdFromRoute, setCurrentNetwork, provider]);

  if (!networkContext) {
    return (
      <View padding={10} justify="space-between" gap={6} direction="column">
        <Button onClick={connectMetamask}>Connect Web3</Button>
      </View>
    );
  }

  return (
    <>
      <br />
      <br />
      <NetworkSwitcher currentNetwork={networkIdFromRoute} />
      <Outlet context={networkContext} />
    </>
  );
};
