"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Incident = exports.IncidentDegree = exports.IncidentType = void 0;
var IncidentType;
(function (IncidentType) {
    IncidentType["MATERIEL"] = "materiel";
    IncidentType["ENVIRONNEMENT"] = "environnement";
    IncidentType["PERSONNEL"] = "personnel";
})(IncidentType || (exports.IncidentType = IncidentType = {}));
var IncidentDegree;
(function (IncidentDegree) {
    IncidentDegree["LOW"] = "low";
    IncidentDegree["MEDIUM"] = "medium";
    IncidentDegree["HIGH"] = "high";
})(IncidentDegree || (exports.IncidentDegree = IncidentDegree = {}));
class Incident {
    id;
    type;
    degree;
    title;
    description;
    reportedAt;
    reportedBy;
}
exports.Incident = Incident;
//# sourceMappingURL=incident.entity.js.map