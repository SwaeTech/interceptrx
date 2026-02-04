"use client";

import { useAuth } from "../../lib/auth-provider";
import { useState, useEffect } from "react";
import { Eye, EyeClosed, FileText } from "lucide-react";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client/react";
import { CREATE_SECRET } from "../graphql/mutations";
import { GET_SECRETS, GET_SECRET_WITH_TOKEN, AUDITS } from "../graphql/queries";

interface TokenData {
  id: string;
  name: string;
  breachCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AuditData {
  id: string;
  secretId: string;
  userId: string;
  orgId: string;
  action: string;
  details: string | null;
  createdAt: string;
}

export default function Sidebar({ expanded }: { expanded: boolean }) {
  const { user } = useAuth();
  const [secretData, setSecretData] = useState<Record<string, TokenData>>({});
  const [secretName, setSecretName] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [viewingToken, setViewingToken] = useState<string | null>(null);
  const [showAudits, setShowAudits] = useState(false);

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

  // Query for audit logs (admin and manager)
  const { data: auditsData } = useQuery<{
    audits: AuditData[];
  }>(AUDITS);

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

                {/* Audit button at bottom */}
                {expanded && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowAudits(!showAudits)}
                      className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{showAudits ? "Hide Audits" : "View Audits"}</span>
                    </button>
                  </div>
                )}

                {/* Audit modal/overlay */}
                {showAudits && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowAudits(false)}
                  >
                    <div
                      className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                          Audit Logs
                        </h2>
                        <button
                          onClick={() => setShowAudits(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
                        {auditsData && auditsData.audits.length > 0 ? (
                          <div className="space-y-2">
                            {auditsData.audits.map((audit) => (
                              <div
                                key={audit.id}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span
                                        className={`px-2 py-1 text-xs font-semibold rounded ${
                                          audit.action === "BREACH"
                                            ? "bg-red-500 text-white"
                                            : audit.action === "VIEW"
                                              ? "bg-blue-500 text-white"
                                              : "bg-gray-500 text-white"
                                        }`}
                                      >
                                        {audit.action}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          audit.createdAt,
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                      <span className="font-medium">
                                        Secret ID:
                                      </span>{" "}
                                      {audit.secretId}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                      <span className="font-medium">
                                        User ID:
                                      </span>{" "}
                                      {audit.userId}
                                    </div>
                                    {audit.details && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        {audit.details}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-8">
                            No audit logs found.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </ul>
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
