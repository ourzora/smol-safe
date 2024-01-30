/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useCallback, useState } from "react";
import { FormControl, Select } from "reshaped";
import { allowedNetworks } from "../chains";
import { useNavigate } from "react-router-dom";

export const NetworkSwitcher = ({
  currentNetwork,
}: {
  currentNetwork: string | undefined;
}) => {
  const [currentNetworkValue, setCurrentNetworkValue] = useState(currentNetwork);
  const navigate = useNavigate();
  const changeNetwork = useCallback(
    (e: { value: string }) => {
      const networkId = e.value; 
      setCurrentNetworkValue(networkId);

      navigate(`/safe/${networkId}`);
    },
    [navigate]
  );

  return (
    <FormControl>
      <FormControl.Label>Network:</FormControl.Label>
      <Select
        name="network"
        value={currentNetworkValue}
        onChange={changeNetwork}
        options={Object.values(allowedNetworks)
          .filter((d) => !!d)
          .map((allowedNetwork) => ({
            key: allowedNetwork.id.toString(),
            value: allowedNetwork.id.toString(),
            label: allowedNetwork.name,
          }))}
      ></Select>
    </FormControl>
  );
};
