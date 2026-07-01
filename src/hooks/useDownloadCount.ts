import { useState, useEffect } from "react";

export function useDownloadCount() {
  const [data, setData] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetch("/api/anime/downloaded")
      .then((r) => r.json())
      .then((d) => setData(d.count ?? 0))
      .catch(() => setData(0));
  }, []);

  return { data };
}
