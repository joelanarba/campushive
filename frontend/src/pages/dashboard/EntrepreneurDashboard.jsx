import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Trash2, MapPin, Clock } from "lucide-react";
import api from "../../services/api";
import { useApp } from "../../context/AppContext";
import Button from "../../components/Button";

export default function EntrepreneurDashboard() {
  const { currentUser } = useApp();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    setLoading(true);
    const res = await api.listMyServices();
    if (res.ok) {
      setServices(res.data.data.services || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (id, title) => {
    if (window.confirm("Are you sure you want to delete ''?")) {
      const res = await api.deleteMyService(id);
      if (res.ok) {
        setServices(services.filter(s => s.id !== id));
      } else {
        alert(res.error || "Failed to delete service");
      }
    }
  };

  return (
    <div className="mx-auto max-w-wrap px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-ink dark:text-paper">Provider Dashboard</h1>
          <p className="text-ink-soft dark:text-paper/70 mt-1">
            Welcome back, {currentUser?.entrepreneur_profile?.business_name || currentUser?.full_name}
          </p>
        </div>
        <Button to="/dashboard/entrepreneur/services/new" className="gap-2">
          <Plus size={18} /> Add New Service
        </Button>
      </div>

      <div className="bg-paper-raised dark:bg-ink-raised rounded-2xl border border-line dark:border-line-dark shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-line dark:border-line-dark bg-ink/5 dark:bg-paper/5">
          <h2 className="text-lg font-semibold text-ink dark:text-paper">Your Services</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-ink-soft dark:text-paper/70">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-ink-soft dark:text-paper/70 mb-4">You haven't listed any services yet.</p>
            <Button to="/dashboard/entrepreneur/services/new" variant="secondary">Create your first service</Button>
          </div>
        ) : (
          <div className="divide-y divide-line dark:divide-line-dark">
            {services.map((svc) => (
              <div key={svc.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-ink dark:text-paper">{svc.title}</h3>
                    {!svc.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-ink-soft dark:text-paper/70 text-sm mb-3 line-clamp-2">{svc.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink-soft dark:text-paper/60">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-honey-deep"></div>
                      GH₵{svc.price}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {svc.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <MapPin size={14} /> {svc.location_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <Button to={`/dashboard/entrepreneur/services/${svc.id}/availability`} variant="secondary" className="px-3 py-2 h-auto" title="Manage Schedule">
                    <Clock size={16} />
                  </Button>
                  <Button to={`/dashboard/entrepreneur/services/${svc.id}/edit`} variant="secondary" className="px-3 py-2 h-auto">
                    <Edit2 size={16} />
                  </Button>
                  <button 
                    onClick={() => handleDelete(svc.id, svc.title)}
                    className="p-2 rounded-md border border-line dark:border-line-dark text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete service"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
