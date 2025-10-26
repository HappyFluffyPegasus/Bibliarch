import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Query keys for cache management
export const queryKeys = {
  user: ['user'] as const,
  profile: (userId: string) => ['profile', userId] as const,
  stories: (userId: string) => ['stories', userId] as const,
  story: (storyId: string) => ['story', storyId] as const,
  canvas: (storyId: string, canvasType: string) => ['canvas', storyId, canvasType] as const,
}

// Get current authenticated user
export function useUser() {
  const supabase = createClient()

  return useQuery({
    queryKey: queryKeys.user,
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    },
    staleTime: 10 * 60 * 1000, // User data rarely changes, cache for 10 min
  })
}

// Get user profile (username, etc.)
export function useProfile(userId: string | null | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: userId ? queryKeys.profile(userId) : ['profile', 'null'],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return { username: 'Storyteller' }
      }

      return data
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // Profile rarely changes, cache for 10 min
  })
}

// Get all stories for a user
export function useStories(userId: string | null | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: userId ? queryKeys.stories(userId) : ['stories', 'null'],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // Stories change more often, cache for 2 min
  })
}

// Get a single story
export function useStory(storyId: string | null | undefined, userId: string | null | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: storyId ? queryKeys.story(storyId) : ['story', 'null'],
    queryFn: async () => {
      if (!storyId || !userId) return null

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!storyId && !!userId,
    staleTime: 5 * 60 * 1000, // Individual story metadata, cache for 5 min
  })
}

// Get canvas data
export function useCanvas(storyId: string | null | undefined, canvasType: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: storyId ? queryKeys.canvas(storyId, canvasType) : ['canvas', 'null', canvasType],
    queryFn: async () => {
      if (!storyId) return null

      const { data, error } = await supabase
        .from('canvas_data')
        .select('*')
        .eq('story_id', storyId)
        .eq('canvas_type', canvasType)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      // PGRST116 means no rows found, which is normal for new canvases
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading canvas:', error)
      }

      return data || null
    },
    enabled: !!storyId,
    staleTime: 30 * 1000, // Canvas data changes frequently, cache for 30 seconds
  })
}

// Mutation for creating a story
export function useCreateStory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, bio, userId }: { title: string; bio: string; userId: string }) => {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          title: title.trim(),
          bio: bio.trim(),
          user_id: userId
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate stories list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.stories(variables.userId) })
    },
  })
}

// Mutation for deleting a story
export function useDeleteStory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ storyId, userId }: { storyId: string; userId: string }) => {
      // Delete all canvas data
      await supabase
        .from('canvas_data')
        .delete()
        .eq('story_id', storyId)

      // Delete the story
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      // Invalidate stories list and the specific story
      queryClient.invalidateQueries({ queryKey: queryKeys.stories(variables.userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.story(variables.storyId) })
    },
  })
}

// Mutation for updating story metadata
export function useUpdateStory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ storyId, title, bio }: { storyId: string; title?: string; bio?: string }) => {
      const { data, error } = await supabase
        .from('stories')
        .update({
          ...(title !== undefined && { title: title.trim() }),
          ...(bio !== undefined && { bio: bio.trim() }),
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific story cache
      queryClient.invalidateQueries({ queryKey: queryKeys.story(variables.storyId) })
    },
  })
}

// Mutation for saving canvas data
export function useSaveCanvas() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      storyId,
      canvasType,
      nodes,
      connections
    }: {
      storyId: string
      canvasType: string
      nodes: any[]
      connections: any[]
    }) => {
      const { data, error } = await supabase
        .from('canvas_data')
        .upsert({
          story_id: storyId,
          canvas_type: canvasType,
          nodes,
          connections,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'story_id,canvas_type'
        })
        .select()

      if (error) {
        console.error('Supabase save error:', error)
        throw error
      }

      return data
    },
    onSuccess: (_, variables) => {
      // Update the canvas cache optimistically
      queryClient.setQueryData(
        queryKeys.canvas(variables.storyId, variables.canvasType),
        {
          story_id: variables.storyId,
          canvas_type: variables.canvasType,
          nodes: variables.nodes,
          connections: variables.connections,
          updated_at: new Date().toISOString()
        }
      )
    },
  })
}
