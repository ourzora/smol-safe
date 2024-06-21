import { Button, View } from "reshaped";
import { SafeInformation } from "../components/SafeInformation";
import { useNavigate, useParams } from "react-router-dom";
import { useUpdateProposalInQuery } from "../hooks/useUpdateProposalViaQuery";

export const SafeInformationPage = () => {
  const { networkId, safeAddress } = useParams();
  const navigate = useNavigate();

  const onNewProposalClick = () => {
    navigate(`/safe/${networkId}/${safeAddress}/new`);
  };

  const { addAction } = useUpdateProposalInQuery({ proposal: undefined });

  return (
    <View gap={4}>
      <SafeInformation addAction={addAction} />
      <Button onClick={onNewProposalClick}>New Proposal</Button>
    </View>
  );
};
