import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Team {
  id: string;
  code: string;
  leader_name: string;
  status: 'waiting' | 'playing' | 'finished';
  created_at: string;
  started_at?: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  name: string;
  is_leader: boolean;
  joined_at: string;
  last_active: string;
}

export const generateTeamCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createTeam = async (leaderName: string) => {
  const code = generateTeamCode();

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      code,
      leader_name: leaderName,
      status: 'waiting'
    })
    .select()
    .maybeSingle();

  if (teamError || !team) {
    throw new Error('Failed to create team');
  }

  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      name: leaderName,
      is_leader: true
    });

  if (memberError) {
    throw new Error('Failed to add team leader');
  }

  return team;
};

export const joinTeam = async (code: string, name: string) => {
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('status', 'waiting')
    .maybeSingle();

  if (teamError || !team) {
    throw new Error('Team not found or already started');
  }

  const { error: memberError } = await supabase
    .from('team_members')
    .insert({
      team_id: team.id,
      name,
      is_leader: false
    });

  if (memberError) {
    if (memberError.message.includes('duplicate')) {
      throw new Error('Name already taken in this team');
    }
    throw new Error('Failed to join team');
  }

  return team;
};

export const getTeamMembers = async (teamId: string) => {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw new Error('Failed to fetch team members');
  }

  return data;
};

export const startTeam = async (teamId: string) => {
  const { error } = await supabase
    .from('teams')
    .update({
      status: 'playing',
      started_at: new Date().toISOString()
    })
    .eq('id', teamId);

  if (error) {
    throw new Error('Failed to start team');
  }
};
