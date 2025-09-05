import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { User, Settings, Bell, Menu, X, Activity, Users, TrendingUp, FileText, Zap, MessageSquare, CreditCard, Upload, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react'

export default function Portal({ supabase }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [clientData, setClientData] = useState(null)
  const [automations, setAutomations] = useState([])
  const [leads, setLeads] = useState([])
  const [metrics, setMetrics] = useState([])
  
  // Onboarding state
  const [projects, setProjects] = useState([])
  const [messages, setMessages] = useState([])
  const [projectFiles, setProjectFiles] = useState([])
  const [tasks, setTasks] = useState([])
  const [approvals, setApprovals] = useState([])
  const [newMessage, setNewMessage] = useState('')

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
        
        // Load existing dashboard data
        const { data: automationData } = await supabase
          .from('automations')
          .select('*')
          .eq('client_id', clientUser.client_id)
        setAutomations(automationData || [])

        const { data: leadData } = await supabase
          .from('leads')
          .select('*')
          .eq('client_id', clientUser.client_id)
          .order('created_at', { ascending: false })
        setLeads(leadData || [])

        const { data: metricData } = await supabase
          .from('metrics')
          .select('*')
          .eq('client_id', clientUser.client_id)
        setMetrics(metricData || [])

        // Load onboarding data
        loadOnboardingData(clientUser.client_id)
      }
    } catch (error) {
      console.error('Error loading client data:', error)
    }
  }

  const loadOnboardingData = async (clientId) => {
    try {
      // Load projects
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
      setProjects(projectData || [])

      if (projectData && projectData.length > 0) {
        const projectId = projectData[0].id

        // Load messages
        const { data: messageData } = await supabase
          .from('messages')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true })
        setMessages(messageData || [])

        // Load files
        const { data: fileData } = await supabase
          .from('project_files')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
        setProjectFiles(fileData || [])

        // Load tasks
        const { data: taskData } = await supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
        setTasks(taskData || [])

        // Load approvals
        const { data: approvalData } = await supabase
          .from('approvals')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
        setApprovals(approvalData || [])

        // Set up real-time subscriptions
        const messageSubscription = supabase
          .channel('messages')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, 
            () => loadMessages(projectId))
          .subscribe()

        const fileSubscription = supabase
          .channel('project_files')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'project_files' }, 
            () => loadFiles(projectId))
          .subscribe()
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error)
    }
  }

  const loadMessages = async (projectId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const loadFiles = async (projectId) => {
    const { data } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setProjectFiles(data || [])
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !projects[0]) return

    try {
      await supabase
        .from('messages')
        .insert({
          project_id: projects[0].id,
          sender_type: 'client',
          sender_name: clientData?.contact_name || user?.email || 'Client',
          message: newMessage
        })
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const signInWithGoogle = async () => {
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
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)

    const signInWithEmail = async (e) => {
      e.preventDefault()
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      })
      if (error) alert('Error signing in: ' + error.message)
    }

    const signUpWithEmail = async (e) => {
      e.preventDefault()
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password
      })
      if (error) alert('Error signing up: ' + error.message)
      else alert('Check your email for confirmation link')
    }

    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="bg-white p-5 rounded shadow text-center" style={{maxWidth: '400px'}}>
          <div className="bg-gradient-to-r from-info to-primary rounded p-3 mb-4 mx-auto" style={{width: '64px', height: '64px'}}>
            <span className="text-white fw-bold fs-5">BF</span>
          </div>
          <h1 className="h2 fw-bold text-dark mb-4">Branded + Flow</h1>
          <p className="text-muted mb-4">Client Portal Access</p>
          
          <form onSubmit={isSignUp ? signUpWithEmail : signInWithEmail} className="mb-3">
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 mb-2">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="btn btn-link text-decoration-none small"
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>

          <hr className="my-3" />
          
          <button
            onClick={signInWithGoogle}
            className="btn btn-outline-primary w-100"
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
        
        <div className="navbar-nav d-flex flex-row">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`btn btn-link text-decoration-none me-3 ${activeTab === 'dashboard' ? 'text-primary fw-bold' : 'text-muted'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`btn btn-link text-decoration-none me-3 ${activeTab === 'onboarding' ? 'text-primary fw-bold' : 'text-muted'}`}
          >
            Project
          </button>
          <Bell size={20} className="text-muted me-3" style={{marginTop: '8px'}} />
          <button onClick={signOut} className="btn btn-link text-muted text-decoration-none">
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )

  const OnboardingView = () => {
    const currentProject = projects[0]
    
    if (!currentProject) {
      return (
        <div className="container-fluid py-4">
          <div className="text-center">
            <h3>No active project found</h3>
            <p className="text-muted">Your project will appear here once we begin your brand development.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="container-fluid py-4">
        {/* Project Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h2 className="h4 mb-1">{currentProject.name}</h2>
                    <p className="text-muted mb-0">Current Phase: {currentProject.current_phase}</p>
                  </div>
                  <div className="text-end">
                    <div className="progress mb-2" style={{width: '200px'}}>
                      <div 
                        className="progress-bar bg-info" 
                        style={{width: `${currentProject.progress}%`}}
                      ></div>
                    </div>
                    <small className="text-muted">{currentProject.progress}% Complete</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Project Timeline */}
          <div className="col-lg-4 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">Project Timeline</h5>
              </div>
              <div className="card-body">
                <div className="timeline">
                  {[
                    { phase: 'Discovery', status: 'completed' },
                    { phase: 'Strategy', status: 'in_progress' },
                    { phase: 'Design', status: 'pending' },
                    { phase: 'Development', status: 'pending' },
                    { phase: 'Automation', status: 'pending' },
                    { phase: 'Launch', status: 'pending' }
                  ].map((item, index) => (
                    <div key={index} className="d-flex align-items-center mb-3">
                      <div className="me-3">
                        {item.status === 'completed' && <CheckCircle size={20} className="text-success" />}
                        {item.status === 'in_progress' && <Clock size={20} className="text-warning" />}
                        {item.status === 'pending' && <AlertCircle size={20} className="text-muted" />}
                      </div>
                      <span className={item.status === 'completed' ? 'text-success' : 
                                    item.status === 'in_progress' ? 'text-warning' : 'text-muted'}>
                        {item.phase}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Communication Panel */}
          <div className="col-lg-8">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Project Communication</h5>
                <MessageSquare size={20} className="text-muted" />
              </div>
              <div className="card-body d-flex flex-column">
                {/* Messages */}
                <div className="flex-grow-1 mb-3" style={{maxHeight: '300px', overflowY: 'auto'}}>
                  {messages.map((message, index) => (
                    <div key={index} className={`mb-3 ${message.sender_type === 'client' ? 'text-end' : ''}`}>
                      <div className={`d-inline-block p-2 rounded ${
                        message.sender_type === 'client' 
                          ? 'bg-primary text-white' 
                          : 'bg-light text-dark'
                      }`} style={{maxWidth: '70%'}}>
                        <div className="small fw-bold mb-1">{message.sender_name}</div>
                        <div>{message.message}</div>
                        <div className="small opacity-75">
                          {new Date(message.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="d-flex">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={sendMessage}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Files and Tasks */}
        <div className="row mt-4">
          {/* Project Files */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Project Files</h5>
                <Upload size={20} className="text-muted" />
              </div>
              <div className="card-body">
                {projectFiles.length === 0 ? (
                  <p className="text-muted text-center">No files uploaded yet</p>
                ) : (
                  projectFiles.map((file, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                      <div>
                        <div className="fw-bold">{file.file_name}</div>
                        <small className="text-muted">Uploaded by {file.uploaded_by}</small>
                      </div>
                      <span className={`badge ${
                        file.file_category === 'logo' ? 'bg-primary' :
                        file.file_category === 'design' ? 'bg-success' :
                        file.file_category === 'document' ? 'bg-info' : 'bg-secondary'
                      }`}>
                        {file.file_category}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">Action Items</h5>
              </div>
              <div className="card-body">
                {tasks.filter(t => t.assigned_to === 'client').length === 0 ? (
                  <p className="text-muted text-center">No pending action items</p>
                ) : (
                  tasks
                    .filter(t => t.assigned_to === 'client')
                    .map((task, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                        <div>
                          <div className="fw-bold">{task.title}</div>
                          {task.description && <small className="text-muted">{task.description}</small>}
                        </div>
                        <span className={`badge ${
                          task.status === 'completed' ? 'bg-success' :
                          task.status === 'in_progress' ? 'bg-warning' : 'bg-secondary'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'onboarding' && <OnboardingView />}
    </div>
  )
}
