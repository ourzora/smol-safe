import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { SafeDataProvider } from "./ViewSafe";
import { Card, Text, View } from "reshaped";
import { allowedNetworks } from "../chains";
import { InfoBox } from "../components/InfoBox";
import { Address } from "viem";

type SafeInformationType = {
  owners: string[];
  threshold: number;
  chainId: number;
  nonce: number;
  address: Address;
};

export const SafeInformationContext = createContext<
  SafeInformationType | undefined
>(undefined);

export const SafeInformation = () => {
  const [safeInformation, setSafeInformation] = useState<SafeInformationType>();
  const safeData = useContext(SafeDataProvider);

  const loadSafeInfo = useCallback(async () => {
    const { safeSdk } = safeData!;
    const owners = await safeSdk.getOwners();
    const threshold = await safeSdk.getThreshold();
    const chainId = await safeSdk.getChainId();
    const nonce = await safeSdk.getNonce();
    const address = (await safeSdk.getAddress()) as Address;

    setSafeInformation({ owners, threshold, chainId, nonce, address });
  }, [safeData]);

  useEffect(() => {
    if (!safeData) {
      return;
    }
    loadSafeInfo();
  }, [safeData]);

  return (
    <>
      {safeInformation && (
        <SafeInformationContext.Provider value={safeInformation}>
          <Card>
            <View divided gap={2}>
              <View.Item>
                <View>
                  <Text variant="body-2">Network:</Text>{" "}
                  <InfoBox>Chain for the Safe</InfoBox>
                </View>
                {allowedNetworks[safeInformation.chainId]?.name ||
                  safeInformation.chainId.toString()}
              </View.Item>
              <View.Item>
                <View>
                  <Text variant="body-2">Threshold:</Text>{" "}
                  <InfoBox>
                    Number of signers that need to approve a transaction before
                    execution
                  </InfoBox>
                </View>
                {safeInformation.threshold}
              </View.Item>
              <View.Item>
                <View>
                  <Text variant="body-2">Signers: </Text>
                  <InfoBox>
                    Signers are the list of addresses for the signers of the
                    multisig
                  </InfoBox>
                </View>
                <View paddingTop={1}>
                  {safeInformation.owners.map((owner) => (
                    <View.Item key={owner}>{owner}</View.Item>
                  ))}
                </View>
              </View.Item>
              <View.Item>
                <View justify="start" direction="row" align="start">
                  <Text variant="body-2">Nonce: </Text>
                  <InfoBox>
                    Nonce is the index of the current transaction of the
                  </InfoBox>
                </View>
                {safeInformation.nonce}
              </View.Item>
            </View>
          </Card>
        </SafeInformationContext.Provider>
      )}
    </>
  );
};
