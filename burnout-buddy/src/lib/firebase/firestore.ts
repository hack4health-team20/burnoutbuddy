import { doc, getDoc, setDoc } from "firebase/firestore";
import { BurnoutData } from "@/types";
import { getDb } from "./client";
import { emptyBurnoutData } from "@/lib/analytics";

const dataDoc = (uid: string) => doc(getDb(), "users", uid, "private", "burnoutData");

export const fetchBurnoutData = async (uid: string): Promise<BurnoutData> => {
  const snapshot = await getDoc(dataDoc(uid));
  if (!snapshot.exists()) {
    return emptyBurnoutData;
  }

  const data = snapshot.data() as BurnoutData | undefined;
  return data ?? emptyBurnoutData;
};

export const persistBurnoutData = async (uid: string, data: BurnoutData) => {
  await setDoc(
    dataDoc(uid),
    {
      ...data,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
};
