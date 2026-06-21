import { createFileRoute } from '@tanstack/react-router'
import { getJokes } from '../serverActions/jokesActions'
import { JokesList } from '../components/JokesList'
import { JokeForm } from '#/components/JokeForm'

export const Route = createFileRoute('/')({
  loader: async () => {
    // Load jokes data when the route is accessed
    return getJokes()
  },
  component: Home,
})

function Home() {
  const  jokes  = Route.useLoaderData()

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <h1 className="text-4xl font-bold text-center mb-10">DevJokes</h1>
      <JokeForm/>
      <JokesList jokes={jokes} />
    </div>
  )
}
