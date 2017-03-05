import os
import cherrypy
from apps.glassfrog.glassfrog import Glassfrog


ROOT = os.path.dirname(os.path.abspath(__file__))
CONFIG = os.path.join(ROOT, 'webservice.config')


class Root(object):

    @cherrypy.expose
    def index(self):
        return 'Hello world!'


def main():
    cherrypy.config.update(CONFIG)
    cherrypy.tree.mount(Root(), '/')
    cherrypy.tree.mount(Glassfrog(), '/glassfrog/', Glassfrog.CONFIG)

    cherrypy.engine.start()
    cherrypy.engine.block()


if __name__ == '__main__':
    main()
