declare global {
  interface Window {
    ab_tester: {
      campaignsData: {
        id: number;
        name: string;
        variations: { id: number; name: string }[];
      }[];
    };
  }
}
