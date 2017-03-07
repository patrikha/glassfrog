import os
import requests
import cherrypy


ROOT = os.path.dirname(os.path.abspath(__file__))
API_KEY = '<INSERT YOUR API KEY HERE>'


class Circle(object):

    def __init__(self, data):
        self.name = data['name']
        self.short_name = data['short_name']
        self.roles = []


class Organization(object):

    def __init__(self, data):
        self.data = data
        self.circles = self.get_circles()

    def find_role(self, id):
        return next(x for x in self.data['linked']['roles'] if x['id'] == id)

    def get_circles(self):
        circles = []
        for circle in  self.data['circles']:
            org_circle = Circle(circle)
            for role in circle['links']['roles']:
                org_circle.roles.append(self.find_role(role)['name'])
            circles.append(org_circle)
        return circles

    def get_d3(self):
        d3_children = []
        d3 = {'name': 'MyOrganization',
              'children': d3_children}
        for circle in self.circles:
            d3_roles = []
            d3_circle = {'name': circle.name,
                         'children': d3_roles}
            for role in circle.roles:
                d3_roles.append({'name': role, 'size': 100})
            d3_children.append(d3_circle)
        return d3


class Glassfrog(object):

    CONFIG = os.path.join(ROOT, 'glassfrog.config')

    def __init__(self):
        self.organization = None

    def get_circles_from_glassfrog(self):
        url = 'https://api.glassfrog.com/api/v3/circles?api_key=%s' % API_KEY
        req = requests.get(url)
        if req.status_code != 200:
            return None
        return Organization(req.json())


    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_circles(self):
        if not self.organization:
            self.organization = self.get_circles_from_glassfrog()
        return self.organization.get_d3()
