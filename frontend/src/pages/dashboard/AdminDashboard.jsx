import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import api from "../../services/api";
import Modal from "../../components/Modal";
import Button from "../../components/Button";

function AdminDashboard() {
  const [entrepreneurs, setEntrepreneurs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  
  // Verification Modal State
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEntrepreneurs();
  }, [statusFilter]);

  const fetchEntrepreneurs = async () => {
    setLoading(true);
    const res = await api.listEntrepreneurs(statusFilter !== "all" ? statusFilter : null);
    if (res.ok) {
      setEntrepreneurs(res.data.data.entrepreneurs);
    }
    setLoading(false);
  };

  const openVerifyModal = (profile, status) => {
    setSelectedProfile(profile);
    setVerificationStatus(status);
    setRejectionReason("");
    setIsModalOpen(true);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (verificationStatus === "rejected" && !rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    setSubmitting(true);
    const res = await api.verifyEntrepreneur(selectedProfile.id, {
      verification_status: verificationStatus,
      rejection_reason: verificationStatus === "rejected" ? rejectionReason : undefined,
    });

    if (res.ok) {
      setIsModalOpen(false);
      fetchEntrepreneurs();
    } else {
      alert(res.error || "Failed to update verification status.");
    }
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-(--color-ink) dark:text-(--color-paper)">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-(--color-ink-soft) dark:text-(--color-paper)/60">
            Manage entrepreneur verifications.
          </p>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm dark:border-(--color-line-dark) dark:bg-(--color-ink) dark:text-(--color-paper)"
        >
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="rounded-xl border border-(--color-line) bg-(--color-paper) dark:border-(--color-line-dark) dark:bg-(--color-ink)">
        {loading ? (
          <div className="p-8 text-center text-(--color-ink-soft) dark:text-(--color-paper)/60">
            Loading...
          </div>
        ) : entrepreneurs.length === 0 ? (
          <div className="p-8 text-center text-(--color-ink-soft) dark:text-(--color-paper)/60">
            No entrepreneurs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-(--color-ink) dark:text-(--color-paper)">
              <thead className="bg-(--color-paper-raised) text-xs uppercase text-(--color-ink-soft) dark:bg-(--color-ink-raised) dark:text-(--color-paper)/60">
                <tr>
                  <th className="px-6 py-4 font-medium">Business Name</th>
                  <th className="px-6 py-4 font-medium">Entrepreneur</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-line) dark:divide-(--color-line-dark)">
                {entrepreneurs.map((profile) => (
                  <tr key={profile.id} className="hover:bg-(--color-paper-raised)/50 dark:hover:bg-(--color-ink-raised)/50">
                    <td className="px-6 py-4 font-medium">{profile.business_name}</td>
                    <td className="px-6 py-4">
                      {profile.user.full_name}
                      <div className="text-xs text-(--color-ink-soft) dark:text-(--color-paper)/60">
                        {profile.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">{profile.location}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        profile.verification_status === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        profile.verification_status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {profile.verification_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {profile.verification_status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openVerifyModal(profile, "verified")}
                            className="rounded bg-green-100 p-1.5 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => openVerifyModal(profile, "rejected")}
                            className="rounded bg-red-100 p-1.5 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      {profile.verification_status !== "pending" && (
                         <button
                           onClick={() => openVerifyModal(profile, profile.verification_status === "verified" ? "rejected" : "verified")}
                           className="text-xs font-medium text-(--color-honey-deep) hover:underline"
                         >
                           {profile.verification_status === "verified" ? "Revoke" : "Approve"}
                         </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={verificationStatus === "verified" ? "Approve Entrepreneur" : "Reject Entrepreneur"}
      >
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm text-(--color-ink-soft) dark:text-(--color-paper)/60">
            {verificationStatus === "verified" 
              ? `Are you sure you want to approve ${selectedProfile?.business_name}? Their services will become visible to all students.` 
              : `You are about to reject ${selectedProfile?.business_name}. Please provide a reason below.`}
          </p>

          {verificationStatus === "rejected" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-(--color-ink) dark:text-(--color-paper)">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                className="w-full rounded-md border border-(--color-line) bg-(--color-paper) px-3 py-2 text-(--color-ink) outline-none focus:border-(--color-honey-deep) focus:ring-1 focus:ring-(--color-honey-deep) dark:border-(--color-line-dark) dark:bg-(--color-ink-raised) dark:text-(--color-paper)"
                rows="3"
                placeholder="e.g. ID verification failed, Invalid student ID..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminDashboard;
