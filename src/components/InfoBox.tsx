import { Icon, Tooltip } from "reshaped";
import { Info } from "react-feather";

export const InfoBox = ({ children }: { children: string }) => {
  return (
    <Tooltip text={children}>
      {(attributes) => (
        <Icon
          size={4}
          attributes={attributes}
          svg={<Info />}
        />
      )}
    </Tooltip>
  );
};
