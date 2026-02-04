"use client";

import { useAuth } from "../../lib/auth-provider";
import { useState, useEffect } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client/react";
import { CREATE_SECRET } from "../graphql/mutations";
import { GET_SECRETS, GET_SECRET_WITH_TOKEN } from "../graphql/queries";

interface TokenData {
  id: string;
  name: string;
  breachCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function Sidebar({ expanded }: { expanded: boolean }) {
  const { user } = useAuth();
  const [secretData, setSecretData] = useState<Record<string, TokenData>>({});
  const [secretName, setSecretName] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [viewingToken, setViewingToken] = useState<string | null>(null);
  // Fetch existing secrets
  const { data: secretsData, refetch } = useQuery<{
    secrets: TokenData[];
  }>(GET_SECRETS);

  // Apollo mutation hook
  const [createSecret, { loading, error }] = useMutation<{
    createSecret: TokenData;
  }>(CREATE_SECRET);

  // Lazy query to fetch token (admin only)
  const [getSecretWithToken] = useLazyQuery<{
    secret: TokenData & { token: string };
  }>(GET_SECRET_WITH_TOKEN);

  // Load secrets into state when data arrives
  useEffect(() => {
    if (secretsData?.secrets) {
      const secretsMap = secretsData.secrets.reduce(
        (acc, secret) => {
          acc[secret.id] = secret;
          return acc;
        },
        {} as Record<string, TokenData>,
      );
      setSecretData(secretsMap);
    }
  }, [secretsData]);

  // Only show for admin or manager
  const scopes = user?.scopes || [];
  const isAdmin = scopes.includes("admin");
  if (!isAdmin && !scopes.includes("manager")) return null;

  const addToken = async () => {
    if (!secretName || !secretValue) return;

    try {
      const result = await createSecret({
        variables: {
          name: secretName,
          token: secretValue,
        },
      });

      if (result.data?.createSecret) {
        // Success - clear the form
        console.log("Secret created:", result);
        setSecretData((prev) => ({
          ...prev,
          [result.data!.createSecret.id]: result.data!.createSecret,
        }));
        setSecretName("");
        setSecretValue("");
        // Refetch to get the latest secrets
        refetch();
      }
    } catch (err) {
      console.error("Error creating secret:", err);
    }
  };

  const handleViewToken = async (secretId: string) => {
    if (viewingToken === secretId) {
      setViewingToken(null);
      return;
    }

    try {
      const result = await getSecretWithToken({
        variables: { id: secretId },
      });

      if (result.data?.secret?.token) {
        setViewingToken(secretId);
        // Store the token in secretData temporarily
        setSecretData((prev) => ({
          ...prev,
          [secretId]: {
            ...prev[secretId],
            token: result.data!.secret.token,
          } as any,
        }));
      }
    } catch (err) {
      console.error("Error fetching token:", err);
    }
  };

  return (
    <aside
      className={`h-full border-r border-gray-200 bg-white text-gray-900 transition-all duration-200 flex flex-col overflow-hidden`}
      style={{ width: expanded ? 256 : 0, minWidth: expanded ? 256 : 0 }}
    >
      <nav className="flex-1 mt-4 space-y-2">
        {expanded && (
          <>
            <div className="flex flex-col space-y-2 px-4 py-2">
              <button
                className="bg-black text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={addToken}
                disabled={loading}
              >
                {loading ? "Saving..." : "add secret"}
              </button>

              {error && (
                <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  Error: {error.message}
                </div>
              )}

              <input
                type="text"
                value={secretName}
                onChange={(e) => setSecretName(e.target.value)}
                placeholder="Friendly Name"
                className="border border-gray-300 rounded-lg p-2"
              />
              <input
                type="text"
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                placeholder="Secret Value"
                minLength={16}
                className="border border-gray-300 rounded-lg p-2"
              />
              <br />
            </div>
            <div className="px-4 py-2">
              {scopes.find((s) => s.startsWith("org:")) && (
                <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                  {scopes.find((s) => s.startsWith("org:"))?.split(":")[1]}
                </div>
              )}
              <h2 className="text-md font-semibold mb-2 text-gray-700">
                Secrets
              </h2>
              <ul className="space-y-2">
                {Object.entries(secretData).map(([key, value]) => (
                  <div
                    className="flex flex-row justify-between bg-gray-100 rounded-lg p-2 border border-gray-200"
                    key={key}
                  >
                    <li key={key} className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">
                          {value.name}
                        </span>
                        {value.breachCount > 0 && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                            {value.breachCount}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-800 break-all font-mono">
                        {viewingToken === key && (value as any).token
                          ? (value as any).token
                          : "••••••••••••••••"}
                      </span>
                    </li>
                    {isAdmin && (
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => handleViewToken(key)}
                      >
                        {viewingToken === key && (value as any).token ? (
                          <Eye className="w-4 h-4 text-gray-500" />
                        ) : (
                          <EyeClosed className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {Object.keys(secretData).length === 0 && (
                  <li className="text-xs text-gray-400 italic">
                    No secrets added yet.
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
