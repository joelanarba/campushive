import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import Button from "../../components/Button";

export default function ServiceDetails() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await api.getService(id);
        if (res.ok) {
          setService(res.data.data.service);
        } else {
          setError(res.error || "Service not found");
        }
      } catch (err) {
        setError("Failed to load service");
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="text-ink-soft dark:text-paper/70">Loading service details...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Oops!</h1>
        <p className="mt-2 text-ink-soft dark:text-paper/70">{error || "Service not found"}</p>
        <div className="mt-6">
          <Button to="/services" variant="secondary">Back to Search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/services" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink dark:text-paper/70 dark:hover:text-paper mb-8 no-underline">
        <ArrowLeft size={16} /> Back to Search
      </Link>
      
      <div className="bg-paper-raised dark:bg-ink-raised rounded-2xl p-6 md:p-10 shadow-sm border border-line dark:border-line-dark">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-honey-tint dark:bg-honey-deep/20 text-moss-deep dark:text-moss-tint font-data text-xs font-semibold mb-4">
              {service.category?.category_name || "Uncategorized"}
            </div>
            
            <h1 className="text-3xl font-bold text-ink dark:text-paper mb-2">{service.title}</h1>
            
            <div className="flex items-center gap-2 text-ink-soft dark:text-paper/70 mb-6">
              <span className="font-medium">{service.entrepreneur?.business_name}</span>
              <CheckCircle2 size={16} className="text-green-600 dark:text-green-500" />
              <span className="text-xs">Verified Provider</span>
            </div>
            
            <div className="prose prose-sm dark:prose-invert max-w-none text-ink-soft dark:text-paper/80 mb-8">
              <p>{service.description || "No description provided."}</p>
            </div>
            
            <div className="flex flex-wrap gap-6 mb-8 border-t border-line dark:border-line-dark pt-6">
              <div className="flex items-center gap-2 text-ink dark:text-paper">
                <Clock size={18} className="text-honey-deep" />
                <span className="font-medium">{service.duration_minutes} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-ink dark:text-paper">
                <MapPin size={18} className="text-honey-deep" />
                <span className="font-medium capitalize">{service.location_type.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          
          <div className="md:w-72 bg-white dark:bg-ink rounded-xl p-6 border border-line dark:border-line-dark shadow-sm shrink-0">
            <div className="text-center mb-6">
              <p className="text-sm text-ink-soft dark:text-paper/70 mb-1">Price</p>
              <p className="text-3xl font-bold text-ink dark:text-paper">GH₵{service.price}</p>
            </div>
            
            <Button 
              className="w-full justify-center py-3" 
              onClick={() => alert("Booking functionality is currently under development!")}
            >
              Book Now
            </Button>
            
            <p className="text-xs text-center text-ink-soft dark:text-paper/60 mt-4">
              You will not be charged yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
