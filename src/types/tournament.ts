// ----------------------------------------------------------------------

export type ITournamentItem = {
  id: number;
  title: string;
  desc: string | null;
  startingStack: number | null;
  regEnd: number | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
};
