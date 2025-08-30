import CellTurnover from "./cell-turnover";

interface RowTabTurnoverProps {
  firstCell: string | number;
  secCell: string | number;
  thirdCell: string | number;
  fourthCell: string | number;
  fifthCell?: string | number | null;
  sixthCell?: string | number | null;
  seventhCell?: string | number;
  eighthCell?: string | number;
  ninthCell?: string | number;
  tenthCell?: string | number;
}

export default function RowTabTurnover({
  firstCell,
  secCell,
  thirdCell,
  fourthCell,
  fifthCell,
  sixthCell,
  seventhCell,
  eighthCell,
  ninthCell,
  tenthCell,
}: RowTabTurnoverProps) {
  return (
    <>
      <CellTurnover value={firstCell} place="first" />
      <CellTurnover value={secCell} place="other" />
      {thirdCell && <CellTurnover value={thirdCell} place="other" />}
      {fourthCell && <CellTurnover value={fourthCell} place="other" />}
      {fifthCell && <CellTurnover value={fifthCell} place="other" />}
      {sixthCell && <CellTurnover value={sixthCell} place="other" />}
      {seventhCell && <CellTurnover value={seventhCell} place="other" />}
      {eighthCell && <CellTurnover value={eighthCell} place="other" />}
      {ninthCell && <CellTurnover value={ninthCell} place="other" />}
      {tenthCell && <CellTurnover value={tenthCell} place="other" />}
    </>
  );
}