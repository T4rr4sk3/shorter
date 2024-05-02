import { test } from '@japa/runner'

test.group('Redirect', () => {
  test('API is up!', async ({ client }) => {
    const res = await client.get('/')

    res.assertStatus(418)
  })

  test('Get Page to redirect', async ({ client }) => {
    const res = await client.get('/KSqgL')

    console.debug(res.body())
    res.assertStatus(302)
  })
})

// test.group('Redirect', () => {
//     test('Get Page to redirect', async ({ client }) => {
//         const res = await client.get('/KSqgL')

//         console.log(res.body())
//         res.assertStatus(200)
//     })
// })
