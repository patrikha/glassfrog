import os
import requests
import cherrypy


ROOT = os.path.dirname(os.path.abspath(__file__))
API_KEY = '<INSERT YOUR API KEY HERE>'
DEFAULT_ROLES = ['Lead Link', 'Secretary', 'Facilitator', 'Rep Link']

class Circle(object):

    def __init__(self, data):
        self.name = data['name']
        self.short_name = data['short_name']
        self.id = data["id"]
        self.roles = []
        self.subcircle_ids = []
        self.subcircles = []
        
    def __empty_circle(self):
        return ((len(self.roles) == 0 ) and (len(self.subcircles) == 0))

    def get_d3(self):
        children = []
        d3 = { 'name': self.name,
               'children': children
             }
            
        if self.__empty_circle():
            children.append({'name' : 'NO ROLES', 'size': 100})
            children.append({'name' : 'NO ROLES', 'size': 100})
        else:    
            for role in self.roles:
                children.append({'name': role, 'size': 100})
            for circle in self.subcircles:
                children.append(circle.get_d3())

        return d3                
        
class Organization(object):

    def __init__(self, data):
        self.data = data
        self.circles = self.get_circles()
        for circle in self.circles:
            for id in circle.subcircle_ids:
                c = next(x for x in self.circles if x.id == id)
                circle.subcircles.append(c)

    def find_role(self, id):
        return next(x for x in self.data['linked']['roles'] if x['id'] == id)

    def __is_role_circle(self, role):
         return (role["links"]["supporting_circle"] != None) 
        
    def get_circles(self):
        circles = []
        for circle in self.data['circles']:
            org_circle = Circle(circle)
            for role_id in circle['links']['roles']:
                r = self.find_role(role_id)
                
                if self.__is_role_circle(r):
                    org_circle.subcircle_ids.append(r['links']["supporting_circle"])
                elif (r["name"] not in DEFAULT_ROLES):
                    org_circle.roles.append(r['name'])
                
            circles.append(org_circle)
        return circles

    def get_d3(self):
        ANCHOR_CIRCLE = 0
        return self.circles[ANCHOR_CIRCLE].get_d3()

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
