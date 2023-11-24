import { useCallback, useContext, useEffect, useState } from "react";
import { SafeDataProvider } from "./ViewSafe";
import { useParams } from "react-router-dom";
import { Card, Text, View } from "reshaped";
import { allowedNetworks } from "../chains";

type SafeInformationType = {
  owners: string[];
  threshold: number;
  chainId: number;
};

export const SafeInformation = () => {
  const [safeInformation, setSafeInformation] = useState<SafeInformationType>();
  const safeData = useContext(SafeDataProvider);
  const params = useParams();
  const loadSafeInfo = useCallback(async () => {
    const { safeSdk } = safeData!;
    const owners = await safeSdk.getOwners();
    const threshold = await safeSdk.getThreshold();
    const chainId = await safeSdk.getChainId();

    setSafeInformation({ owners, threshold, chainId });
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
        <Card>
          <View divided gap={2}>
            <View.Item>
              <Text variant="body-2">Network:</Text>{" "}
              {allowedNetworks[safeInformation.chainId]?.name ||
                safeInformation.chainId.toString()}
            </View.Item>
            <View.Item>
              <Text variant="body-2">Threshold:</Text>{" "}
              {safeInformation.threshold}
            </View.Item>
            <View.Item>
              <Text variant="body-2">Signers:</Text>
              <View paddingTop={1}>
                {safeInformation.owners.map((owner) => (
                  <View.Item key={owner}>{owner}</View.Item>
                ))}
              </View>
            </View.Item>
          </View>
        </Card>
      )}
    </>
  );
};
