import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { FiUsers, FiUserPlus, FiMail, FiSearch } from "react-icons/fi";
import ProjectHeader from "../../../components/ui/ProjectHeader";
import { get, post } from "../../../utils/http";

const TeamManagement = () => {
  const { projectId } = useParams();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [invitations, setInvitations] = useState([]);

  const fetchTeam = async () => {
    const [teamRes, invitesRes] = await Promise.allSettled([
      get("/manageusers/" + projectId + "/get-all-users"),
      get("/invitations/project/" + projectId),
    ]);
    if (teamRes.status === "fulfilled") setTeam(teamRes.value.data || []);
    if (invitesRes.status === "fulfilled")
      setInvitations(invitesRes.value.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, [projectId]);

  const handleSearch = async () => {
    if (!inviteEmail.trim()) return;
    const { data } = await post("/admin-projects/get-searched-user", {
      email: inviteEmail,
      projectId,
    });
    setSearchResult(data);
  };

  const handleInvite = async (userId) => {
    setSending(true);
    const { error } = await post(
      "/admin-projects/send-project-invitation",
      { userId, projectId },
    );
    if (!error) {
      setInviteEmail("");
      setSearchResult(null);
      await fetchTeam();
    }
    setSending(false);
  };

  const handleInviteByEmail = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);
    const { error } = await post("/invitations", {
      email: inviteEmail,
      projectId,
    });
    if (!error) {
      setInviteEmail("");
      setSearchResult(null);
      await fetchTeam();
    }
    setSending(false);
  };

  // Filter out pending invitations for confirmed members
  const activeTeamEmails = new Set(
    team
      .map((member) => (member.email || member.user?.email || "").toLowerCase().trim())
      .filter(Boolean)
  );

  const pendingInvitations = invitations.filter(
    (inv) => !activeTeamEmails.has((inv.email || "").toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-[#fcfaf8] dark:bg-[#000000] pt-4 transition-colors duration-300">
      <ProjectHeader
        projectId={projectId}
        icon={FiUsers}
        title="Team"
        highlight="Personnel"
        subtitle={`${team.length} operatives deployed`}
        pageLabel="Team"
      />

      <div className="space-y-6">
        {/* Deploy Form Section */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Deploy New Operative
          </h2>
          <form
            onSubmit={handleInviteByEmail}
            className="flex items-end gap-3 flex-wrap"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] bg-white dark:bg-[#000] text-gray-900 dark:text-white placeholder-gray-400 font-medium focus:ring-2 focus:ring-orange-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="px-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#1a1a1a] text-gray-500 hover:text-orange-600 hover:border-orange-500 transition-all"
                >
                  <FiSearch size={18} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white font-bold hover:from-orange-500 hover:to-orange-600 disabled:opacity-50 transition-all shadow-md"
            >
              <FiUserPlus size={16} /> {sending ? "Deploying..." : "Invite"}
            </button>
          </form>

          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-[#1a1a1a] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white font-bold">
                  {(searchResult.name || "?").charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {searchResult.name}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {searchResult.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleInvite(searchResult.userId)}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-all"
              >
                Send Invite
              </button>
            </motion.div>
          )}
        </div>

        {/* Active Operatives Section - Grid Layout */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Active Operatives
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-100 dark:bg-[#151515] rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : team.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 font-medium">
              No operatives deployed.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {team.map((member) => (
                <div
                  key={member._id || member.user?._id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-[#1a1a1a] hover:border-orange-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {(member.name || member.user?.name || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {member.name || member.user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                        {member.email || member.user?.email || ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize shrink-0 ml-2">
                    {member.role || "member"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations Section - Grid Layout */}
        {pendingInvitations.length > 0 && (
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiMail size={14} /> Pending Invitations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv._id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-100 dark:border-[#1a1a1a]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <FiMail size={15} />
                    </div>
                    <span className="text-xs md:text-sm text-gray-700 dark:text-gray-300 font-medium truncate">
                      {inv.email}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold uppercase shrink-0 ml-2">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagement;
