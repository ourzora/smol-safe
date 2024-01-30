import { useState } from "react";
import { Button, Card, Text, View } from "reshaped";
import { allowedNetworks } from "../chains";
import { InfoBox } from "../components/InfoBox";
import { Address } from "viem";
import { AddressView } from "../components/AddressView";
import { OwnerAction, SetOwnerModal } from "../components/SetOwnerModal";
import { useOutletContext } from "react-router-dom";
import { SafeContext } from "./Contexts";

const SafeInformationItem = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <>
    <View direction="row" align="center">
      <Text variant="body-2">{title}:</Text> <InfoBox>{description}</InfoBox>
    </View>
    {children}
  </>
);

export const SafeInformation = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const [ownerAction, setOwnerAction] = useState<OwnerAction>();

  const { safeInformation } = useOutletContext<SafeContext>();

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
            <SafeInformationItem
              title="Network"
              description="Chain for the Safe"
            >
              {allowedNetworks[safeInformation.chainId]?.name ||
                safeInformation.chainId.toString()}
            </SafeInformationItem>
          </View.Item>
          <View.Item>
            <SafeInformationItem
              title="Threshold"
              description="Number of signers that need to approve a transaction before
              execution"
            >
              {safeInformation.threshold}
            </SafeInformationItem>
          </View.Item>
          <View.Item>
            <SafeInformationItem
              title="Signers"
              description="Signers are the list of addresses for the signers of the multisig"
            >
              <View paddingTop={1}>
                {safeInformation.owners.map((owner) => (
                  <View.Item key={owner}>
                    <View align="center" direction="row">
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
                    </View>
                  </View.Item>
                ))}
                <View.Item>
                  <View justify="end" direction="row">
                    <View>
                      <Button
                        onClick={() => {
                          setOwnerAction({ type: "add" });
                        }}
                      >
                        Add
                      </Button>
                    </View>
                  </View>
                </View.Item>
              </View>
            </SafeInformationItem>
          </View.Item>
          <View.Item>
            <SafeInformationItem
              title="Nonce"
              description="Nonce is the index of the current transaction of the safe"
            >
              {safeInformation.nonce}
            </SafeInformationItem>
          </View.Item>
        </View>
      </Card>
      {children}
    </div>
  );
};
