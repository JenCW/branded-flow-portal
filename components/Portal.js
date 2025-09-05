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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-lg">BF</span>
          </div>
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-lg">BF</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Branded + Flow</h1>
          <p className="text-gray-600 mb-6">Client Portal Access</p>
          <button
            onClick={signIn}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
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

  // Rest of your portal components go here (Navigation, DashboardView, etc.)
  // Copy from the working version above...

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation and content */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BF</span>
              </div>
              <span className="text-xl font-bold text-gray-800">Branded + Flow</span>
              {clientData && (
                <span className="text-sm text-gray-500">{clientData.company_name}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Bell className="w-5 h-5 text-gray-600" />
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome to your portal, {clientData?.company_name}!
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-semibold text-teal-800">Active Automations</h3>
              <p className="text-2xl font-bold text-teal-600">{dashboardData.automations.active}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Total Leads</h3>
              <p className="text-2xl font-bold text-blue-600">{dashboardData.leads.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">CRM Contacts</h3>
              <p className="text-2xl font-bold text-green-600">{dashboardData.crm.contacts}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
