import { StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  containerFirst: {
    flex: 1,
    paddingLeft: 10,
    display: "flex",
    justifyContent: "center",
  },
  labelFirst: {
    fontSize: 10,
    fontWeight: "bold",
  },

  containerOther: {
    flex: 1,
    borderLeft: "0.5px solid rgba(0, 0, 0, 0.1)",
    height: "100%",
    display: "flex",
    justifyContent: "center",
  },
  labelOther: {
    fontSize: 9, // Taille réduite pour plus de lisibilité
    textAlign: "center",
    lineHeight: 1.3, // Espacement amélioré entre les lignes
    paddingVertical: 2, // Padding vertical pour aérer
  },
});

interface ViewValueProps {
  value: string | number;
  place: "first" | "other";
}

export default function CellTurnover({ value, place }: ViewValueProps) {
  const roundedValue =
    typeof value === "number" ? value.toFixed(2) + " €" : value;

  return (
    <View
      style={styles[place === "first" ? "containerFirst" : "containerOther"]}
    >
      <Text style={styles[place === "first" ? "labelFirst" : "labelOther"]}>
        {roundedValue}
      </Text>
    </View>
  );
}