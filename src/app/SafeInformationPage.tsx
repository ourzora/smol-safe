import { Button, View } from "reshaped";
import { SafeInformation } from "../components/SafeInformation";
import { Link, useNavigate, useParams } from "react-router-dom";

export const SafeInformationPage = () => {
  const { networkId, safeAddress } = useParams();
  const navigate = useNavigate();

  const onNewProposalClick = () => {
    navigate(`/safe/${networkId}/${safeAddress}/new`);
  };

  return (
    <View gap={4}>
      <SafeInformation />
      <Button onClick={onNewProposalClick}>New Proposal</Button>
    </View>
  );
};
