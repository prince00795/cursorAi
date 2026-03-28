import { useQuery } from '@tanstack/react-query';
import { farmerApi, applicationApi } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import SchemeCard from '../components/SchemeCard';
import StatCard from '../components/StatCard';
import { BookOpen, FileText, CheckCircle, AlertCircle, ArrowRight, User } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['farmerProfile'],
    queryFn: () => farmerApi.getProfile().then(r => r.data),
    retry: false,
  });

  const { data: schemesData, isLoading: schemesLoading } = useQuery({
    queryKey: ['mySchemes'],
    queryFn: () => farmerApi.getMySchemes().then(r => r.data),
    enabled: !!profileData,
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => applicationApi.getMyApplications().then(r => r.data),
    enabled: !!profileData,
  });

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Complete Your Profile First</h2>
          <p className="text-gray-500 mb-6 hindi">पहले अपनी प्रोफ़ाइल पूरी करें</p>
          <p className="text-gray-600 mb-6 text-sm max-w-md mx-auto">
            To find government schemes you're eligible for, we need your farm details like land area, income, caste, and crops.
          </p>
          <Link to="/profile" className="btn-primary inline-flex">
            Complete Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const eligibleSchemes = schemesData?.eligible_schemes || [];
  const applications = applicationsData || [];
  const appliedCount = applications.filter((a: { status: string }) => a.status === 'applied' || a.status === 'approved').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1 hindi">नमस्ते — आपकी पात्र योजनाएं देखें</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Eligible Schemes"
          value={schemesLoading ? '...' : schemesData?.total_eligible || 0}
          icon={BookOpen}
          color="green"
          sub="Based on your profile"
        />
        <StatCard
          label="Tracking"
          value={applications.length}
          icon={FileText}
          color="blue"
          sub="Applications in tracker"
        />
        <StatCard
          label="Applied"
          value={appliedCount}
          icon={CheckCircle}
          color="purple"
          sub="Submitted applications"
        />
        <StatCard
          label="Land Area"
          value={`${profileData.land_area_acres} Ac`}
          icon={AlertCircle}
          color="orange"
          sub={`${profileData.district}, ${profileData.state}`}
        />
      </div>

      {/* Top eligible schemes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Your Top Eligible Schemes</h2>
            <p className="text-sm text-gray-500">Priority-ranked based on your profile</p>
          </div>
          <Link to="/schemes" className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {schemesLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : eligibleSchemes.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {eligibleSchemes.slice(0, 4).map((match: Parameters<typeof SchemeCard>[0]['match'], idx: number) => (
              <SchemeCard key={match!.scheme.id} match={match} rank={idx + 1} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p className="text-gray-500">No schemes found. Please update your profile with accurate details.</p>
          </div>
        )}
      </div>

      {/* Profile summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Profile Summary</h3>
          <Link to="/profile" className="text-brand-600 text-sm hover:text-brand-700 font-medium">Edit Profile</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Location:</span>
            <p className="font-medium">{profileData.district}, {profileData.state}</p>
          </div>
          <div>
            <span className="text-gray-500">Land Area:</span>
            <p className="font-medium">{profileData.land_area_acres} Acres ({profileData.land_type})</p>
          </div>
          <div>
            <span className="text-gray-500">Annual Income:</span>
            <p className="font-medium">₹{Number(profileData.annual_income).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <span className="text-gray-500">Caste Category:</span>
            <p className="font-medium">{profileData.caste}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
