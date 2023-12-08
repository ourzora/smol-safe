import { useContext, useState } from "react";
import { SafeInformationContext } from "./ViewSafe";
import { Button, Card, Text, View } from "reshaped";
import { allowedNetworks } from "../chains";
import { InfoBox } from "../components/InfoBox";
import { Address } from "viem";
import { AddressView } from "../components/AddressView";
import { OwnerAction, SetOwnerModal } from "../components/SetOwnerModal";

export const SafeInformation = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const [ownerAction, setOwnerAction] = useState<OwnerAction>();

  const safeInformation = useContext(SafeInformationContext);

  if (!safeInformation) return <div></div>;
  return (
    <div>
      {ownerAction && (
        <SetOwnerModal
          onClose={() => {
            setOwnerAction(undefined);
          }}
          action={ownerAction}
        />
      )}
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
                <View.Item key={owner}>
                  <AddressView address={owner as Address} />
                  <Button
                    onClick={() => {
                      setOwnerAction({ type: "remove", address: owner });
                    }}
                    variant="ghost"
                  >
                    {" "}
                    x{" "}
                  </Button>
                </View.Item>
              ))}
              <View.Item>
                <Button
                  onClick={() => {
                    setOwnerAction({ type: "add" });
                  }}
                >
                  Add
                </Button>
              </View.Item>
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
      {children}
    </div>
  );
};
