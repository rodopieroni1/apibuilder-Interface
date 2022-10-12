import pages from '../pages'

const routes = Object.keys(pages).map((e,i) => {
    const Component = pages[e]?.component ? pages[e].component : pages[e]
    const params = pages[e].params ?? ''
    const title = pages[e].title ?? e
    return ({
        route: (i ? `/${e.toLowerCase().replaceAll(' ', '-')}/` : '/'),
        as: e,
        Component,
        position: i,
        params,
        title
    })
})
console.log(routes)
export default routes