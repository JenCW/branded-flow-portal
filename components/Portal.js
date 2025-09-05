import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { User, Settings, Bell, Menu, X, Activity, Users, TrendingUp, FileText, Zap, MessageSquare, CreditCard } from 'lucide-react'

export default function Portal({ supabase }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clientData, setClientData] = useState(null)
  const [automations, setAutomations] = useState([])
  const [leads, setLeads] = useState([])
  const [metrics, setMetrics] = useState([])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        loadClientData(session.user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadClientData(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadClientData = async (userId) => {
    try {
      // Get client from user relationship
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('client_id, clients(*)')
        .eq('user_id', userId)
        .single()

      if (clientUser) {
        setClientData(clientUser.clients)
        
        // Load automations
        const { data: automationData } = await supabase
          .from('automations')
          .select('*')
          .eq('client_id', clientUser.client_id)
        
        setAutomations(automationData || [])

        // Load leads
        const { data: leadData } = await supabase
          .from('leads')
          .select('*')
          .eq('client_id', clientUser.client_id)
          .order('created_at', { ascending: false })
        
        setLeads(leadData || [])

        // Load metrics
        const { data: metricData } = await supabase
          .from('metrics')
          .select('*')
          .eq('client_id', clientUser.client_id)
        
        setMetrics(metricData || [])
      }
    } catch (error) {
      console.error('Error loading client data:', error)
    }
  }

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    })
    if (error) console.error('Error signing in:', error)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error signing out:', error)
  }

  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="bg-gradient-to-r from-info to-primary rounded p-3 mb-3 mx-auto" style={{width: '64px', height: '64px'}}>
            <span className="text-white fw-bold fs-5">BF</span>
          </div>
          <p className="text-muted">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="bg-white p-5 rounded shadow text-center" style={{maxWidth: '400px'}}>
          <div className="bg-gradient-to-r from-info to-primary rounded p-3 mb-4 mx-auto" style={{width: '64px', height: '64px'}}>
            <span className="text-white fw-bold fs-5">BF</span>
          </div>
          <h1 className="h2 fw-bold text-dark mb-4">Branded + Flow</h1>
          <p className="text-muted mb-4">Client Portal Access</p>
          <button
            onClick={signIn}
            className="btn btn-primary px-4 py-2"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    )
  }

  // Calculate dashboard metrics
  const dashboardData = {
    automations: {
      active: automations.filter(a => a.status === 'active').length,
      totalRuns: automations.reduce((sum, a) => sum + (a.total_runs || 0), 0),
      successRate: automations.length > 0 ? 
        ((automations.reduce((sum, a) => sum + (a.successful_runs || 0), 0) / 
          automations.reduce((sum, a) => sum + (a.total_runs || 1), 1)) * 100).toFixed(1) : 0
    },
    leads: {
      total: leads.length,
      thisWeek: leads.filter(l => {
        const leadDate = new Date(l.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return leadDate > weekAgo
      }).length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      converted: leads.filter(l => l.status === 'converted').length
    },
    crm: {
      contacts: metrics.find(m => m.metric_type === 'crm_contacts')?.value || 0
    }
  }

  const leadData = [
    { name: 'Mon', leads: 8, qualified: 3 },
    { name: 'Tue', leads: 12, qualified: 5 },
    { name: 'Wed', leads: 6, qualified: 2 },
    { name: 'Thu', leads: 15, qualified: 7 },
    { name: 'Fri', leads: 11, qualified: 4 },
    { name: 'Sat', leads: 4, qualified: 1 },
    { name: 'Sun', leads: 7, qualified: 2 }
  ]

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "primary" }) => (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="card-text text-muted small">{title}</p>
            <p className={`h2 fw-bold text-${color}`}>{value}</p>
            <p className="small text-muted">{subtitle}</p>
          </div>
          <Icon size={32} className={`text-${color}`} />
        </div>
      </div>
    </div>
  )

  const AutomationStatus = ({ automation }) => (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div 
              className={`rounded-circle me-3 ${automation.status === 'active' ? 'bg-success' : 'bg-warning'}`}
              style={{width: '12px', height: '12px'}}
            ></div>
            <div>
              <h6 className="mb-1">{automation.name}</h6>
              <p className="small text-muted mb-0">
                {automation.total_runs} runs • {((automation.successful_runs / automation.total_runs) * 100).toFixed(1)}% success
              </p>
            </div>
          </div>
          <span className={`badge ${automation.status === 'active' ? 'bg-success' : 'bg-warning'}`}>
            {automation.status}
          </span>
        </div>
      </div>
    </div>
  )

  const Navigation = () => (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <div className="bg-gradient-to-r from-info to-primary rounded p-2 me-3">
            <span className="text-white fw-bold small">BF</span>
          </div>
          <span className="navbar-brand h4 mb-0">Branded + Flow</span>
          {clientData && (
            <span className="text-muted small ms-3">{clientData.company_name}</span>
          )}
        </div>
        
        <div className="navbar-nav">
          <div className="nav-item dropdown">
            <Bell size={20} className="text-muted me-3" />
            <button onClick={signOut} className="btn btn-link text-muted text-decoration-none">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )

  const DashboardView = () => (
    <div className="container-fluid py-4">
      {/* Client Banner */}
      <div className="card bg-gradient-to-r from-info to-primary text-white mb-4">
        <div className="card-body">
          <h2 className="h3 fw-bold">{clientData?.company_name || 'Welcome'}</h2>
          <p className="mb-0 opacity-75">Welcome to your Branded + Flow portal</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <StatCard
            title="Active Automations"
            value={dashboardData.automations.active}
            subtitle={`${dashboardData.automations.totalRuns} total runs`}
            icon={Zap}
            color="info"
          />
        </div>
        <div className="col-md-3">
          <StatCard
            title="Total Leads"
            value={dashboardData.leads.total}
            subtitle={`+${dashboardData.leads.thisWeek} this week`}
            icon={Users}
            color="primary"
          />
        </div>
        <div className="col-md-3">
          <StatCard
            title="CRM Contacts"
            value={dashboardData.crm.contacts}
            subtitle="Active contacts"
            icon={Activity}
            color="success"
          />
        </div>
        <div className="col-md-3">
          <StatCard
            title="Success Rate"
            value={`${dashboardData.automations.successRate}%`}
            subtitle="Automation performance"
            icon={TrendingUp}
            color="warning"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Lead Generation This Week</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="#0d6efd" />
                  <Bar dataKey="qualified" fill="#20c997" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Automation Performance</h5>
            </div>
            <div className="card-body">
              {automations.slice(0, 3).map((automation, index) => (
                <AutomationStatus key={index} automation={automation} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">Recent Activity</h5>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="bg-success rounded-circle me-3" style={{width: '8px', height: '8px'}}></div>
            <span className="small">Lead generation automation completed - 8 new leads added to CRM</span>
            <span className="text-muted small ms-auto">2 minutes ago</span>
          </div>
          <div className="d-flex align-items-center mb-3">
            <div className="bg-primary rounded-circle me-3" style={{width: '8px', height: '8px'}}></div>
            <span className="small">Social media post published to LinkedIn and Facebook</span>
            <span className="text-muted small ms-auto">1 hour ago</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="bg-info rounded-circle me-3" style={{width: '8px', height: '8px'}}></div>
            <span className="small">CRM sync completed - 15 contacts updated</span>
            <span className="text-muted small ms-auto">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-vh-100 bg-light">
      <Navigation />
      <DashboardView />
    </div>
  )
}
