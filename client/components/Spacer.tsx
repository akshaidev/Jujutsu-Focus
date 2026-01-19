import { View } from "react-native";
import { Spacing } from "@/constants/theme";

type Size = keyof typeof Spacing;

type Props = {
  size?: Size;
  horizontal?: boolean;
};

export default function Spacer({ size = "md", horizontal = false }: Props) {
  const value = Spacing[size];
  const style = horizontal ? { width: value } : { height: value };
  return <View style={style} />;
}
