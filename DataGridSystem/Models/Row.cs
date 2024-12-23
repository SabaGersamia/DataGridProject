using Newtonsoft.Json;

namespace DataGridSystem.Models
{
    public class Row
    {
        public int RowId { get; set; }
        public int GridId { get; set; }  
        public string Values { get; set; }  

        public DataGrid DataGrid { get; set; }  

        public void SetValues(object values)
        {
            Values = JsonConvert.SerializeObject(values);
        }
        
        public T GetValues<T>()
        {
            return JsonConvert.DeserializeObject<T>(Values);
        }
    }

}
